# Frontend Integration Guide - Measura Backend API

This comprehensive guide provides all the information needed to integrate with the Measura Backend API using modern React patterns, including Axios for HTTP requests, React hooks for state management, Zod for form validation, and object-based parameters for better maintainability.

## Table of Contents

1. [API Base Information](#api-base-information)
2. [Setup & Dependencies](#setup--dependencies)
3. [React Hooks Architecture](#react-hooks-architecture)
4. [Authentication & Authorization](#authentication--authorization)
5. [User Management](#user-management)
6. [Function Point Analysis (FPA)](#function-point-analysis-fpa)
7. [Goal-Question-Metric (GQM)](#goal-question-metric-gqm)
8. [Measurement Plans](#measurement-plans)
9. [Error Handling](#error-handling)
10. [Form Validation with Zod](#form-validation-with-zod)
11. [Integration Examples](#integration-examples)
12. [File Upload Guidelines](#file-upload-guidelines)

## API Base Information

### Base URL

- **Development**: `http://localhost:8080`
- **Production**: `https://your-production-domain.com`

### API Documentation

- **Swagger UI**: `{BASE_URL}/api`
- **OpenAPI Spec**: `{BASE_URL}/api-json`

### Request/Response Format

- **Content-Type**: `application/json`
- **Authentication**: Bearer Token (JWT)
- **Date Format**: ISO 8601 (`YYYY-MM-DDTHH:mm:ss.sssZ`)

---

## Setup & Dependencies

### Required Dependencies

```bash
npm install axios swr zod react-hook-form @hookform/resolvers
# or
yarn add axios swr zod react-hook-form @hookform/resolvers
```

### Axios Configuration

```typescript
// src/lib/axios.ts
import axios from 'axios';

const baseURL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';

export const apiClient = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor for token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${baseURL}/auth/refresh-token`, {
            refreshToken,
          });

          const { accessToken } = response.data;
          localStorage.setItem('accessToken', accessToken);

          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);
```

### SWR Configuration

```typescript
// src/lib/swr.ts
import { SWRConfig } from 'swr';
import { apiClient } from './axios';

export const swrConfig = {
  fetcher: (url: string) => apiClient.get(url).then(res => res.data),
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  shouldRetryOnError: true,
  errorRetryCount: 3,
  errorRetryInterval: 1000,
};

// App wrapper with SWR config
export const SWRProvider = ({ children }: { children: React.ReactNode }) => (
  <SWRConfig value={swrConfig}>
    {children}
  </SWRConfig>
);
```

---

## React Hooks Architecture

### Suggested Hook Structure

```
src/
  hooks/
    auth/
      useAuth.ts
      useLogin.ts
      useRegister.ts
      usePasswordReset.ts
    users/
      useUsers.ts
      useUserProfile.ts
      useUser.ts
    fpa/
      estimates/
        useEstimates.ts
        useEstimate.ts
        useCreateEstimate.ts
        useUpdateEstimate.ts
      components/
        useALI.ts
        useEI.ts
        useEO.ts
        useEQ.ts
        useAIE.ts
      documents/
        useDocuments.ts
        useUploadDocument.ts
      reports/
        useReports.ts
        useGenerateReport.ts
      calculations/
        useCalculations.ts
    gqm/
      goals/
        useGoals.ts
        useCreateGoal.ts
      questions/
        useQuestions.ts
      metrics/
        useMetrics.ts
        useMetricData.ts
      objectives/
        useObjectives.ts
    plans/
      usePlans.ts
      useCreatePlan.ts
      usePlanVersions.ts
```

### Base Hook Patterns with SWR

```typescript
// src/hooks/common/types.ts
export interface UseSWROptions {
  revalidateOnFocus?: boolean;
  revalidateOnMount?: boolean;
  revalidateIfStale?: boolean;
  refreshInterval?: number;
  errorRetryCount?: number;
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
}

export interface UseMutationOptions<T, V> {
  onSuccess?: (data: T, variables: V) => void;
  onError?: (error: Error, variables: V) => void;
  onSettled?: () => void;
}

// src/hooks/common/useMutation.ts
import { useState } from 'react';
import { mutate } from 'swr';

export const useMutation = <T, V>(
  mutationFn: (variables: V) => Promise<T>,
  options?: {
    onSuccess?: (data: T, variables: V) => void;
    onError?: (error: Error, variables: V) => void;
    onSettled?: () => void;
  },
) => {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutateAsync = async (variables: V): Promise<T> => {
    setIsPending(true);
    setError(null);

    try {
      const data = await mutationFn(variables);
      options?.onSuccess?.(data, variables);
      return data;
    } catch (err) {
      const error = err as Error;
      setError(error);
      options?.onError?.(error, variables);
      throw error;
    } finally {
      setIsPending(false);
      options?.onSettled?.();
    }
  };

  return {
    mutateAsync,
    isPending,
    error,
    reset: () => {
      setError(null);
      setIsPending(false);
    },
  };
};

// src/hooks/common/useInvalidate.ts
import { mutate } from 'swr';

export const useInvalidate = () => {
  const invalidate = (key: string | string[]) => {
    if (Array.isArray(key)) {
      key.forEach((k) => mutate(k));
    } else {
      mutate(key);
    }
  };

  const invalidateAll = (pattern: string) => {
    mutate(
      (key) => typeof key === 'string' && key.startsWith(pattern),
      undefined,
      { revalidate: true },
    );
  };

  return { invalidate, invalidateAll };
};
```

---

## Authentication & Authorization

### Zod Schemas for Validation

```typescript
// src/schemas/auth.ts
import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z
    .enum(['USER', 'ADMIN', 'PROJECT_MANAGER', 'MEASUREMENT_ANALYST'])
    .optional(),
});

export const loginSchema = z.object({
  usernameOrEmail: z.string().min(1, 'Username or email is required'),
  password: z.string().min(1, 'Password is required'),
});

export const passwordResetRequestSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const passwordResetSchema = z
  .object({
    token: z.string().min(1, 'Token is required'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z
      .string()
      .min(8, 'Confirm password must be at least 8 characters'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;
export type PasswordResetRequestData = z.infer<
  typeof passwordResetRequestSchema
>;
export type PasswordResetData = z.infer<typeof passwordResetSchema>;
```

### Authentication Service

```typescript
// src/services/authService.ts
import { apiClient } from '@/lib/axios';
import type {
  RegisterFormData,
  LoginFormData,
  PasswordResetRequestData,
  PasswordResetData,
} from '@/schemas/auth';

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    username: string;
    email: string;
    role: string;
  };
}

export const authService = {
  register: async (data: RegisterFormData): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/register', data);
    return response.data;
  },

  login: async (data: LoginFormData): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/login', data);
    return response.data;
  },

  firebaseLogin: async (params: { idToken: string }): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/firebase-login', params);
    return response.data;
  },

  refreshToken: async (params: {
    refreshToken: string;
  }): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/refresh-token', params);
    return response.data;
  },

  requestPasswordReset: async (
    data: PasswordResetRequestData,
  ): Promise<{ message: string }> => {
    const response = await apiClient.post('/auth/password-reset-request', data);
    return response.data;
  },

  resetPassword: async (
    data: PasswordResetData,
  ): Promise<{ message: string }> => {
    const response = await apiClient.post('/auth/password-reset', data);
    return response.data;
  },

  verifyEmail: async (params: {
    token: string;
  }): Promise<{ message: string }> => {
    const response = await apiClient.get('/auth/verify-email', {
      params,
    });
    return response.data;
  },
};
```

### Authentication Hooks

```typescript
// src/hooks/auth/useAuth.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthResponse } from '@/services/authService';

interface AuthStore {
  user: AuthResponse['user'] | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setAuth: (authData: AuthResponse) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      setAuth: (authData) =>
        set({
          user: authData.user,
          accessToken: authData.accessToken,
          refreshToken: authData.refreshToken,
          isAuthenticated: true,
        }),
      logout: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: 'auth-storage',
    },
  ),
);

// src/hooks/auth/useLogin.ts
import { authService } from '@/services/authService';
import { useAuthStore } from './useAuth';
import { useMutation } from '@/hooks/common/useMutation';
import type { LoginFormData } from '@/schemas/auth';
import type { UseMutationOptions } from '@/hooks/common/types';

interface UseLoginOptions extends UseMutationOptions<any, LoginFormData> {}

export const useLogin = (options?: UseLoginOptions) => {
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation(authService.login, {
    onSuccess: (data, variables) => {
      setAuth(data);
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      options?.onSuccess?.(data, variables);
    },
    onError: options?.onError,
  });
};

// src/hooks/auth/useRegister.ts
import { authService } from '@/services/authService';
import { useAuthStore } from './useAuth';
import { useMutation } from '@/hooks/common/useMutation';
import type { RegisterFormData } from '@/schemas/auth';
import type { UseMutationOptions } from '@/hooks/common/types';

interface UseRegisterOptions
  extends UseMutationOptions<any, RegisterFormData> {}

export const useRegister = (options?: UseRegisterOptions) => {
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation(authService.register, {
    onSuccess: (data, variables) => {
      setAuth(data);
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      options?.onSuccess?.(data, variables);
    },
    onError: options?.onError,
  });
};

// src/hooks/auth/usePasswordReset.ts
import { authService } from '@/services/authService';
import { useMutation } from '@/hooks/common/useMutation';
import type {
  PasswordResetRequestData,
  PasswordResetData,
} from '@/schemas/auth';

export const usePasswordResetRequest = (options?: {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}) => {
  return useMutation(authService.requestPasswordReset, options);
};

export const usePasswordReset = (options?: {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}) => {
  return useMutation(authService.resetPassword, options);
};
```

### Authentication Forms with React Hook Form + Zod

```typescript
// src/components/auth/LoginForm.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginFormData } from '@/schemas/auth';
import { useLogin } from '@/hooks/auth/useLogin';

export const LoginForm = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const loginMutation = useLogin({
    onSuccess: () => {
      // Redirect to dashboard
      window.location.href = '/dashboard';
    },
    onError: (error) => {
      console.error('Login failed:', error);
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    await loginMutation.mutateAsync(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <input
          {...register('usernameOrEmail')}
          placeholder="Username or Email"
          type="text"
        />
        {errors.usernameOrEmail && (
          <span>{errors.usernameOrEmail.message}</span>
        )}
      </div>

      <div>
        <input
          {...register('password')}
          placeholder="Password"
          type="password"
        />
        {errors.password && <span>{errors.password.message}</span>}
      </div>

      <button
        type="submit"
        disabled={loginMutation.isPending}
      >
        {loginMutation.isPending ? 'Signing in...' : 'Sign In'}
      </button>

      {loginMutation.error && (
        <div>Error: {loginMutation.error.message}</div>
      )}
    </form>
  );
};

// src/components/auth/RegisterForm.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, type RegisterFormData } from '@/schemas/auth';
import { useRegister } from '@/hooks/auth/useRegister';

export const RegisterForm = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: 'USER',
    },
  });

  const registerMutation = useRegister({
    onSuccess: () => {
      // Redirect to dashboard
      window.location.href = '/dashboard';
    },
    onError: (error) => {
      console.error('Registration failed:', error);
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    await registerMutation.mutateAsync(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <input
          {...register('email')}
          placeholder="Email"
          type="email"
        />
        {errors.email && <span>{errors.email.message}</span>}
      </div>

      <div>
        <input
          {...register('username')}
          placeholder="Username"
          type="text"
        />
        {errors.username && <span>{errors.username.message}</span>}
      </div>

      <div>
        <input
          {...register('password')}
          placeholder="Password"
          type="password"
        />
        {errors.password && <span>{errors.password.message}</span>}
      </div>

      <div>
        <select {...register('role')}>
          <option value="USER">User</option>
          <option value="PROJECT_MANAGER">Project Manager</option>
          <option value="MEASUREMENT_ANALYST">Measurement Analyst</option>
          <option value="ADMIN">Admin</option>
        </select>
        {errors.role && <span>{errors.role.message}</span>}
      </div>

      <button
        type="submit"
        disabled={registerMutation.isPending}
      >
        {registerMutation.isPending ? 'Creating Account...' : 'Create Account'}
      </button>

      {registerMutation.error && (
        <div>Error: {registerMutation.error.message}</div>
      )}
    </form>
  );
};
```

---

## User Management

### User Service

```typescript
// src/services/userService.ts
import { apiClient } from '@/lib/axios';

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  role: string;
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserData {
  username: string;
  email: string;
  password: string;
  role?: string;
  provider?: string;
}

export interface UpdateUserData {
  username?: string;
  email?: string;
  role?: string;
  isActive?: boolean;
}

export const userService = {
  getProfile: async (): Promise<UserProfile> => {
    const response = await apiClient.get('/users/profile');
    return response.data;
  },

  getAllUsers: async (): Promise<UserProfile[]> => {
    const response = await apiClient.get('/users');
    return response.data;
  },

  getUserById: async (params: { id: string }): Promise<UserProfile> => {
    const response = await apiClient.get(`/users/${params.id}`);
    return response.data;
  },

  getUserByEmail: async (params: { email: string }): Promise<UserProfile> => {
    const response = await apiClient.get(`/users/email/${params.email}`);
    return response.data;
  },

  createUser: async (data: CreateUserData): Promise<UserProfile> => {
    const response = await apiClient.post('/users', data);
    return response.data;
  },

  updateUser: async (params: {
    id: string;
    data: UpdateUserData;
  }): Promise<UserProfile> => {
    const response = await apiClient.put(`/users/${params.id}`, params.data);
    return response.data;
  },

  deleteUser: async (params: { id: string }): Promise<void> => {
    await apiClient.delete(`/users/${params.id}`);
  },
};
```

### User Hooks

```typescript
// src/hooks/users/useUsers.ts
import useSWR from 'swr';
import { userService } from '@/services/userService';
import type { UseSWROptions } from '@/hooks/common/types';

export const useUsers = (options?: UseSWROptions) => {
  return useSWR('/users', userService.getAllUsers, options);
};

// src/hooks/users/useUserProfile.ts
import useSWR from 'swr';
import { userService } from '@/services/userService';
import type { UseSWROptions } from '@/hooks/common/types';

export const useUserProfile = (options?: UseSWROptions) => {
  return useSWR('/users/profile', userService.getProfile, options);
};

// src/hooks/users/useUser.ts
import useSWR from 'swr';
import { userService } from '@/services/userService';
import type { UseSWROptions } from '@/hooks/common/types';

export const useUser = (params: { id: string }, options?: UseSWROptions) => {
  return useSWR(
    params.id ? `/users/${params.id}` : null,
    () => userService.getUserById(params),
    options,
  );
};

// src/hooks/users/useCreateUser.ts
import { useMutation } from '@/hooks/common/useMutation';
import { useInvalidate } from '@/hooks/common/useInvalidate';
import { userService } from '@/services/userService';
import type { CreateUserData } from '@/services/userService';

export const useCreateUser = (options?: {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}) => {
  const { invalidate } = useInvalidate();

  return useMutation(userService.createUser, {
    onSuccess: (data, variables) => {
      invalidate('/users');
      options?.onSuccess?.(data);
    },
    onError: options?.onError,
  });
};

// src/hooks/users/useUpdateUser.ts
import { useMutation } from '@/hooks/common/useMutation';
import { useInvalidate } from '@/hooks/common/useInvalidate';
import { userService } from '@/services/userService';
import type { UpdateUserData } from '@/services/userService';

export const useUpdateUser = (options?: {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}) => {
  const { invalidate } = useInvalidate();

  return useMutation(userService.updateUser, {
    onSuccess: (data, variables) => {
      invalidate(['/users', `/users/${variables.id}`]);
      options?.onSuccess?.(data);
    },
    onError: options?.onError,
  });
};
```

---

## Function Point Analysis (FPA)

### FPA Zod Schemas

```typescript
// src/schemas/fpa.ts
import { z } from 'zod';

export const createEstimateSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').max(100),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(1000),
  projectId: z.string().min(1, 'Project ID is required'),
  productivityFactor: z.number().min(1).optional(),
  internalLogicalFiles: z.array(z.string()).optional(),
  externalInterfaceFiles: z.array(z.string()).optional(),
  externalInputs: z.array(z.string()).optional(),
  externalOutputs: z.array(z.string()).optional(),
  externalQueries: z.array(z.string()).optional(),
  generalSystemCharacteristics: z
    .array(z.number().min(0).max(5))
    .length(14)
    .optional(),
  notes: z.string().max(2000).optional(),
});

export const updateEstimateSchema = createEstimateSchema.partial();

export const createALISchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  recordElementTypes: z
    .number()
    .min(1, 'Must have at least 1 record element type'),
  dataElementTypes: z.number().min(1, 'Must have at least 1 data element type'),
});

export const createEISchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  fileTypesReferenced: z.number().min(0),
  dataElementTypes: z.number().min(0),
});

export const createEOSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  fileTypesReferenced: z.number().min(0),
  dataElementTypes: z.number().min(0),
});

export const createEQSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  fileTypesReferenced: z.number().min(0),
  dataElementTypes: z.number().min(0),
});

export const createAIESchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  recordElementTypes: z.number().min(1),
  dataElementTypes: z.number().min(1),
  externalSystem: z.string().min(1, 'External system is required'),
  notes: z.string().optional(),
});

export type CreateEstimateData = z.infer<typeof createEstimateSchema>;
export type UpdateEstimateData = z.infer<typeof updateEstimateSchema>;
export type CreateALIData = z.infer<typeof createALISchema>;
export type CreateEIData = z.infer<typeof createEISchema>;
export type CreateEOData = z.infer<typeof createEOSchema>;
export type CreateEQData = z.infer<typeof createEQSchema>;
export type CreateAIEData = z.infer<typeof createAIESchema>;
```

### FPA Services

```typescript
// src/services/estimateService.ts
import { apiClient } from '@/lib/axios';
import type { CreateEstimateData, UpdateEstimateData } from '@/schemas/fpa';

export interface EstimateResponse {
  id: string;
  name: string;
  description: string;
  project: any;
  createdBy: any;
  status: 'DRAFT' | 'IN_PROGRESS' | 'FINALIZED' | 'ARCHIVED';
  unadjustedFunctionPoints: number;
  valueAdjustmentFactor: number;
  adjustedFunctionPoints: number;
  estimatedEffortHours: number;
  productivityFactor: number;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface CalculationResponse {
  unadjustedFunctionPoints: number;
  valueAdjustmentFactor: number;
  adjustedFunctionPoints: number;
  estimatedEffortHours: number;
  breakdown: {
    ali: { count: number; points: number };
    aie: { count: number; points: number };
    ei: { count: number; points: number };
    eo: { count: number; points: number };
    eq: { count: number; points: number };
  };
}

export const estimateService = {
  getEstimates: async (params?: {
    projectId?: string;
  }): Promise<EstimateResponse[]> => {
    const response = await apiClient.get('/estimates', { params });
    return response.data;
  },

  getEstimate: async (params: { id: string }): Promise<EstimateResponse> => {
    const response = await apiClient.get(`/estimates/${params.id}`);
    return response.data;
  },

  createEstimate: async (
    data: CreateEstimateData,
  ): Promise<EstimateResponse> => {
    const response = await apiClient.post('/estimates', data);
    return response.data;
  },

  updateEstimate: async (params: {
    id: string;
    data: UpdateEstimateData;
  }): Promise<EstimateResponse> => {
    const response = await apiClient.put(
      `/estimates/${params.id}`,
      params.data,
    );
    return response.data;
  },

  deleteEstimate: async (params: {
    id: string;
  }): Promise<{ success: boolean }> => {
    const response = await apiClient.delete(`/estimates/${params.id}`);
    return response.data;
  },

  createNewVersion: async (params: {
    id: string;
  }): Promise<EstimateResponse> => {
    const response = await apiClient.post(`/estimates/${params.id}/version`);
    return response.data;
  },

  calculateFunctionPoints: async (params: {
    estimateId: string;
  }): Promise<CalculationResponse> => {
    const response = await apiClient.post(
      `/estimates/${params.estimateId}/calculate`,
    );
    return response.data;
  },
};

// src/services/fpaComponentService.ts
import { apiClient } from '@/lib/axios';
import type {
  CreateALIData,
  CreateEIData,
  CreateEOData,
  CreateEQData,
  CreateAIEData,
} from '@/schemas/fpa';

export interface ComponentResponse {
  id: string;
  name: string;
  description: string;
  complexity: 'LOW' | 'AVERAGE' | 'HIGH';
  functionPoints: number;
  createdAt: string;
  updatedAt: string;
}

export const fpaComponentService = {
  // ALI (Internal Logical Files)
  ali: {
    getAll: async (params: {
      estimateId: string;
    }): Promise<ComponentResponse[]> => {
      const response = await apiClient.get(
        `/estimates/${params.estimateId}/ali`,
      );
      return response.data;
    },

    getOne: async (params: {
      estimateId: string;
      id: string;
    }): Promise<ComponentResponse> => {
      const response = await apiClient.get(
        `/estimates/${params.estimateId}/ali/${params.id}`,
      );
      return response.data;
    },

    create: async (params: {
      estimateId: string;
      data: CreateALIData;
    }): Promise<ComponentResponse> => {
      const response = await apiClient.post(
        `/estimates/${params.estimateId}/ali`,
        params.data,
      );
      return response.data;
    },

    update: async (params: {
      estimateId: string;
      id: string;
      data: Partial<CreateALIData>;
    }): Promise<ComponentResponse> => {
      const response = await apiClient.put(
        `/estimates/${params.estimateId}/ali/${params.id}`,
        params.data,
      );
      return response.data;
    },

    delete: async (params: {
      estimateId: string;
      id: string;
    }): Promise<void> => {
      await apiClient.delete(
        `/estimates/${params.estimateId}/ali/${params.id}`,
      );
    },
  },

  // EI (External Inputs)
  ei: {
    getAll: async (params: {
      estimateId: string;
    }): Promise<ComponentResponse[]> => {
      const response = await apiClient.get(
        `/estimates/${params.estimateId}/ei`,
      );
      return response.data;
    },

    create: async (params: {
      estimateId: string;
      data: CreateEIData;
    }): Promise<ComponentResponse> => {
      const response = await apiClient.post(
        `/estimates/${params.estimateId}/ei`,
        params.data,
      );
      return response.data;
    },

    update: async (params: {
      estimateId: string;
      id: string;
      data: Partial<CreateEIData>;
    }): Promise<ComponentResponse> => {
      const response = await apiClient.put(
        `/estimates/${params.estimateId}/ei/${params.id}`,
        params.data,
      );
      return response.data;
    },

    delete: async (params: {
      estimateId: string;
      id: string;
    }): Promise<void> => {
      await apiClient.delete(`/estimates/${params.estimateId}/ei/${params.id}`);
    },
  },

  // EO (External Outputs)
  eo: {
    getAll: async (params: {
      estimateId: string;
    }): Promise<ComponentResponse[]> => {
      const response = await apiClient.get(
        `/estimates/${params.estimateId}/eo`,
      );
      return response.data;
    },

    create: async (params: {
      estimateId: string;
      data: CreateEOData;
    }): Promise<ComponentResponse> => {
      const response = await apiClient.post(
        `/estimates/${params.estimateId}/eo`,
        params.data,
      );
      return response.data;
    },

    update: async (params: {
      estimateId: string;
      id: string;
      data: Partial<CreateEOData>;
    }): Promise<ComponentResponse> => {
      const response = await apiClient.put(
        `/estimates/${params.estimateId}/eo/${params.id}`,
        params.data,
      );
      return response.data;
    },

    delete: async (params: {
      estimateId: string;
      id: string;
    }): Promise<void> => {
      await apiClient.delete(`/estimates/${params.estimateId}/eo/${params.id}`);
    },
  },

  // EQ (External Queries)
  eq: {
    getAll: async (params: {
      estimateId: string;
    }): Promise<ComponentResponse[]> => {
      const response = await apiClient.get(
        `/estimates/${params.estimateId}/eq`,
      );
      return response.data;
    },

    create: async (params: {
      estimateId: string;
      data: CreateEQData;
    }): Promise<ComponentResponse> => {
      const response = await apiClient.post(
        `/estimates/${params.estimateId}/eq`,
        params.data,
      );
      return response.data;
    },

    update: async (params: {
      estimateId: string;
      id: string;
      data: Partial<CreateEQData>;
    }): Promise<ComponentResponse> => {
      const response = await apiClient.put(
        `/estimates/${params.estimateId}/eq/${params.id}`,
        params.data,
      );
      return response.data;
    },

    delete: async (params: {
      estimateId: string;
      id: string;
    }): Promise<void> => {
      await apiClient.delete(`/estimates/${params.estimateId}/eq/${params.id}`);
    },
  },

  // AIE (External Interface Files)
  aie: {
    getAll: async (params: {
      estimateId: string;
    }): Promise<ComponentResponse[]> => {
      const response = await apiClient.get(
        `/estimates/${params.estimateId}/aie`,
      );
      return response.data;
    },

    create: async (params: {
      estimateId: string;
      data: CreateAIEData;
    }): Promise<ComponentResponse> => {
      const response = await apiClient.post(
        `/estimates/${params.estimateId}/aie`,
        params.data,
      );
      return response.data;
    },

    update: async (params: {
      estimateId: string;
      id: string;
      data: Partial<CreateAIEData>;
    }): Promise<ComponentResponse> => {
      const response = await apiClient.put(
        `/estimates/${params.estimateId}/aie/${params.id}`,
        params.data,
      );
      return response.data;
    },

    delete: async (params: {
      estimateId: string;
      id: string;
    }): Promise<void> => {
      await apiClient.delete(
        `/estimates/${params.estimateId}/aie/${params.id}`,
      );
    },
  },
};
```

### FPA Hooks

```typescript
// src/hooks/fpa/estimates/useEstimates.ts
import useSWR from 'swr';
import { estimateService } from '@/services/estimateService';
import type { UseSWROptions } from '@/hooks/common/types';

export const useEstimates = (
  params?: { projectId?: string },
  options?: UseSWROptions,
) => {
  const key = params?.projectId
    ? `/estimates?projectId=${params.projectId}`
    : '/estimates';

  return useSWR(key, () => estimateService.getEstimates(params), options);
};

// src/hooks/fpa/estimates/useEstimate.ts
import useSWR from 'swr';
import { estimateService } from '@/services/estimateService';
import type { UseSWROptions } from '@/hooks/common/types';

export const useEstimate = (
  params: { id: string },
  options?: UseSWROptions,
) => {
  return useSWR(
    params.id ? `/estimates/${params.id}` : null,
    () => estimateService.getEstimate(params),
    options,
  );
};

// src/hooks/fpa/estimates/useCreateEstimate.ts
import { useMutation } from '@/hooks/common/useMutation';
import { useInvalidate } from '@/hooks/common/useInvalidate';
import { estimateService } from '@/services/estimateService';
import type { CreateEstimateData } from '@/schemas/fpa';
import type { UseMutationOptions } from '@/hooks/common/types';

interface UseCreateEstimateOptions
  extends UseMutationOptions<any, CreateEstimateData> {}

export const useCreateEstimate = (options?: UseCreateEstimateOptions) => {
  const { invalidateAll } = useInvalidate();

  return useMutation(estimateService.createEstimate, {
    onSuccess: (data, variables) => {
      invalidateAll('/estimates');
      options?.onSuccess?.(data, variables);
    },
    onError: options?.onError,
  });
};

// src/hooks/fpa/estimates/useUpdateEstimate.ts
import { useMutation } from '@/hooks/common/useMutation';
import { useInvalidate } from '@/hooks/common/useInvalidate';
import { estimateService } from '@/services/estimateService';
import type { UpdateEstimateData } from '@/schemas/fpa';
import type { UseMutationOptions } from '@/hooks/common/types';

interface UseUpdateEstimateOptions
  extends UseMutationOptions<any, { id: string; data: UpdateEstimateData }> {}

export const useUpdateEstimate = (options?: UseUpdateEstimateOptions) => {
  const { invalidate, invalidateAll } = useInvalidate();

  return useMutation(estimateService.updateEstimate, {
    onSuccess: (data, variables) => {
      invalidateAll('/estimates');
      invalidate(`/estimates/${variables.id}`);
      options?.onSuccess?.(data, variables);
    },
    onError: options?.onError,
  });
};

// src/hooks/fpa/calculations/useCalculations.ts
import { useMutation } from '@/hooks/common/useMutation';
import { useInvalidate } from '@/hooks/common/useInvalidate';
import { estimateService } from '@/services/estimateService';
import type { UseMutationOptions } from '@/hooks/common/types';

interface UseCalculateFunctionPointsOptions
  extends UseMutationOptions<any, { estimateId: string }> {}

export const useCalculateFunctionPoints = (
  options?: UseCalculateFunctionPointsOptions,
) => {
  const { invalidate } = useInvalidate();

  return useMutation(estimateService.calculateFunctionPoints, {
    onSuccess: (data, variables) => {
      invalidate(`/estimates/${variables.estimateId}`);
      options?.onSuccess?.(data, variables);
    },
    onError: options?.onError,
  });
};

// src/hooks/fpa/components/useALI.ts
import useSWR from 'swr';
import { useMutation } from '@/hooks/common/useMutation';
import { useInvalidate } from '@/hooks/common/useInvalidate';
import { fpaComponentService } from '@/services/fpaComponentService';
import type { CreateALIData } from '@/schemas/fpa';
import type { UseSWROptions, UseMutationOptions } from '@/hooks/common/types';

export const useALIComponents = (
  params: { estimateId: string },
  options?: UseSWROptions,
) => {
  return useSWR(
    params.estimateId ? `/estimates/${params.estimateId}/ali` : null,
    () => fpaComponentService.ali.getAll(params),
    options,
  );
};

export const useCreateALI = (
  options?: UseMutationOptions<
    any,
    { estimateId: string; data: CreateALIData }
  >,
) => {
  const { invalidate } = useInvalidate();

  return useMutation(fpaComponentService.ali.create, {
    onSuccess: (data, variables) => {
      invalidate(`/estimates/${variables.estimateId}/ali`);
      options?.onSuccess?.(data, variables);
    },
    onError: options?.onError,
  });
};

export const useUpdateALI = (
  options?: UseMutationOptions<
    any,
    { estimateId: string; id: string; data: Partial<CreateALIData> }
  >,
) => {
  const { invalidate } = useInvalidate();

  return useMutation(fpaComponentService.ali.update, {
    onSuccess: (data, variables) => {
      invalidate(`/estimates/${variables.estimateId}/ali`);
      options?.onSuccess?.(data, variables);
    },
    onError: options?.onError,
  });
};

export const useDeleteALI = (
  options?: UseMutationOptions<any, { estimateId: string; id: string }>,
) => {
  const { invalidate } = useInvalidate();

  return useMutation(fpaComponentService.ali.delete, {
    onSuccess: (data, variables) => {
      invalidate(`/estimates/${variables.estimateId}/ali`);
      options?.onSuccess?.(data, variables);
    },
    onError: options?.onError,
  });
};

// Similar patterns for EI, EO, EQ, AIE components
export const useEIComponents = (
  params: { estimateId: string },
  options?: UseSWROptions,
) => {
  return useSWR(
    params.estimateId ? `/estimates/${params.estimateId}/ei` : null,
    () => fpaComponentService.ei.getAll(params),
    options,
  );
};

export const useCreateEI = (options?: UseMutationOptions<any, any>) => {
  const { invalidate } = useInvalidate();
  return useMutation(fpaComponentService.ei.create, {
    onSuccess: (data, variables) => {
      invalidate(`/estimates/${variables.estimateId}/ei`);
      options?.onSuccess?.(data, variables);
    },
    onError: options?.onError,
  });
};

export const useEOComponents = (
  params: { estimateId: string },
  options?: UseSWROptions,
) => {
  return useSWR(
    params.estimateId ? `/estimates/${params.estimateId}/eo` : null,
    () => fpaComponentService.eo.getAll(params),
    options,
  );
};

export const useCreateEO = (options?: UseMutationOptions<any, any>) => {
  const { invalidate } = useInvalidate();
  return useMutation(fpaComponentService.eo.create, {
    onSuccess: (data, variables) => {
      invalidate(`/estimates/${variables.estimateId}/eo`);
      options?.onSuccess?.(data, variables);
    },
    onError: options?.onError,
  });
};

export const useEQComponents = (
  params: { estimateId: string },
  options?: UseSWROptions,
) => {
  return useSWR(
    params.estimateId ? `/estimates/${params.estimateId}/eq` : null,
    () => fpaComponentService.eq.getAll(params),
    options,
  );
};

export const useCreateEQ = (options?: UseMutationOptions<any, any>) => {
  const { invalidate } = useInvalidate();
  return useMutation(fpaComponentService.eq.create, {
    onSuccess: (data, variables) => {
      invalidate(`/estimates/${variables.estimateId}/eq`);
      options?.onSuccess?.(data, variables);
    },
    onError: options?.onError,
  });
};

export const useAIEComponents = (
  params: { estimateId: string },
  options?: UseSWROptions,
) => {
  return useSWR(
    params.estimateId ? `/estimates/${params.estimateId}/aie` : null,
    () => fpaComponentService.aie.getAll(params),
    options,
  );
};

export const useCreateAIE = (options?: UseMutationOptions<any, any>) => {
  const { invalidate } = useInvalidate();
  return useMutation(fpaComponentService.aie.create, {
    onSuccess: (data, variables) => {
      invalidate(`/estimates/${variables.estimateId}/aie`);
      options?.onSuccess?.(data, variables);
    },
    onError: options?.onError,
  });
};
```

### FPA Forms with Zod Validation

```typescript
// src/components/fpa/CreateEstimateForm.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createEstimateSchema, type CreateEstimateData } from '@/schemas/fpa';
import { useCreateEstimate } from '@/hooks/fpa/estimates/useCreateEstimate';

interface CreateEstimateFormProps {
  onSuccess?: (estimate: any) => void;
}

export const CreateEstimateForm = ({ onSuccess }: CreateEstimateFormProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateEstimateData>({
    resolver: zodResolver(createEstimateSchema),
  });

  const createEstimateMutation = useCreateEstimate({
    onSuccess: (data) => {
      reset();
      onSuccess?.(data);
    },
    onError: (error) => {
      console.error('Failed to create estimate:', error);
    },
  });

  const onSubmit = async (data: CreateEstimateData) => {
    await createEstimateMutation.mutateAsync(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <input
          {...register('name')}
          placeholder="Estimate Name"
          type="text"
        />
        {errors.name && <span>{errors.name.message}</span>}
      </div>

      <div>
        <textarea
          {...register('description')}
          placeholder="Description"
        />
        {errors.description && <span>{errors.description.message}</span>}
      </div>

      <div>
        <input
          {...register('projectId')}
          placeholder="Project ID"
          type="text"
        />
        {errors.projectId && <span>{errors.projectId.message}</span>}
      </div>

      <div>
        <input
          {...register('productivityFactor', { valueAsNumber: true })}
          placeholder="Productivity Factor"
          type="number"
          min="1"
        />
        {errors.productivityFactor && (
          <span>{errors.productivityFactor.message}</span>
        )}
      </div>

      <div>
        <textarea
          {...register('notes')}
          placeholder="Notes (optional)"
        />
        {errors.notes && <span>{errors.notes.message}</span>}
      </div>

      <button
        type="submit"
        disabled={createEstimateMutation.isPending}
      >
        {createEstimateMutation.isPending ? 'Creating...' : 'Create Estimate'}
      </button>

      {createEstimateMutation.error && (
        <div>Error: {createEstimateMutation.error.message}</div>
      )}
    </form>
  );
};

// src/components/fpa/CreateALIForm.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createALISchema, type CreateALIData } from '@/schemas/fpa';
import { useCreateALI } from '@/hooks/fpa/components/useALI';

interface CreateALIFormProps {
  estimateId: string;
  onSuccess?: (ali: any) => void;
}

export const CreateALIForm = ({ estimateId, onSuccess }: CreateALIFormProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateALIData>({
    resolver: zodResolver(createALISchema),
  });

  const createALIMutation = useCreateALI({
    onSuccess: (data) => {
      reset();
      onSuccess?.(data);
    },
    onError: (error) => {
      console.error('Failed to create ALI:', error);
    },
  });

  const onSubmit = async (data: CreateALIData) => {
    await createALIMutation.mutateAsync({ estimateId, data });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <input
          {...register('name')}
          placeholder="ALI Name"
          type="text"
        />
        {errors.name && <span>{errors.name.message}</span>}
      </div>

      <div>
        <textarea
          {...register('description')}
          placeholder="Description"
        />
        {errors.description && <span>{errors.description.message}</span>}
      </div>

      <div>
        <input
          {...register('recordElementTypes', { valueAsNumber: true })}
          placeholder="Record Element Types"
          type="number"
          min="1"
        />
        {errors.recordElementTypes && (
          <span>{errors.recordElementTypes.message}</span>
        )}
      </div>

      <div>
        <input
          {...register('dataElementTypes', { valueAsNumber: true })}
          placeholder="Data Element Types"
          type="number"
          min="1"
        />
        {errors.dataElementTypes && (
          <span>{errors.dataElementTypes.message}</span>
        )}
      </div>

      <button
        type="submit"
        disabled={createALIMutation.isPending}
      >
        {createALIMutation.isPending ? 'Creating...' : 'Create ALI'}
      </button>

      {createALIMutation.error && (
        <div>Error: {createALIMutation.error.message}</div>
      )}
    </form>
  );
};
```

---

## Goal-Question-Metric (GQM)

### GQM Zod Schemas

```typescript
// src/schemas/gqm.ts
import { z } from 'zod';

export const createGoalSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').max(100),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(1000),
  organizationId: z.string().optional(),
});

export const createQuestionSchema = z.object({
  text: z
    .string()
    .min(5, 'Question text must be at least 5 characters')
    .max(500),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(1000),
  goalId: z.string().min(1, 'Goal ID is required'),
  priority: z.number().min(1).max(5, 'Priority must be between 1 and 5'),
});

export const createMetricSchema = z
  .object({
    name: z.string().min(3, 'Name must be at least 3 characters').max(100),
    description: z
      .string()
      .min(10, 'Description must be at least 10 characters')
      .max(1000),
    questionId: z.string().min(1, 'Question ID is required'),
    type: z.enum(['QUANTITATIVE', 'QUALITATIVE']),
    unit: z.enum(['COUNT', 'PERCENTAGE', 'TIME', 'SIZE', 'CUSTOM']),
    customUnitLabel: z.string().optional(),
    formula: z.string().optional(),
    targetValue: z.number().optional(),
    frequency: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.unit === 'CUSTOM' && !data.customUnitLabel) {
        return false;
      }
      return true;
    },
    {
      message: 'Custom unit label is required when unit is CUSTOM',
      path: ['customUnitLabel'],
    },
  );

export const createObjectiveSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').max(100),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(1000),
  goalIds: z.array(z.string()).min(1, 'At least one goal must be selected'),
  organizationId: z.string().optional(),
});

export const metricDataSchema = z.object({
  value: z.number({ required_error: 'Value is required' }),
  timestamp: z.string().optional(),
  notes: z.string().max(1000).optional(),
});

export type CreateGoalData = z.infer<typeof createGoalSchema>;
export type CreateQuestionData = z.infer<typeof createQuestionSchema>;
export type CreateMetricData = z.infer<typeof createMetricSchema>;
export type CreateObjectiveData = z.infer<typeof createObjectiveSchema>;
export type MetricDataEntry = z.infer<typeof metricDataSchema>;
```

### GQM Services

```typescript
// src/services/gqmService.ts
import { apiClient } from '@/lib/axios';
import type {
  CreateGoalData,
  CreateQuestionData,
  CreateMetricData,
  CreateObjectiveData,
  MetricDataEntry,
} from '@/schemas/gqm';

export interface GoalResponse {
  id: string;
  name: string;
  description: string;
  organizationId?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface QuestionResponse {
  id: string;
  text: string;
  description: string;
  goalId: string;
  goal?: GoalResponse;
  priority: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface MetricResponse {
  id: string;
  name: string;
  description: string;
  questionId: string;
  question?: QuestionResponse;
  type: 'QUANTITATIVE' | 'QUALITATIVE';
  unit: 'COUNT' | 'PERCENTAGE' | 'TIME' | 'SIZE' | 'CUSTOM';
  customUnitLabel?: string;
  formula?: string;
  targetValue?: number;
  frequency?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ObjectiveResponse {
  id: string;
  name: string;
  description: string;
  goalIds: string[];
  goals?: GoalResponse[];
  organizationId?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface MetricDataResponse {
  id: string;
  metricId: string;
  value: number;
  timestamp: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
}

export const gqmService = {
  // Goals
  goals: {
    getAll: async (): Promise<GoalResponse[]> => {
      const response = await apiClient.get('/goals');
      return response.data;
    },

    getMyGoals: async (): Promise<GoalResponse[]> => {
      const response = await apiClient.get('/goals/my-goals');
      return response.data;
    },

    getById: async (params: { id: string }): Promise<GoalResponse> => {
      const response = await apiClient.get(`/goals/${params.id}`);
      return response.data;
    },

    create: async (data: CreateGoalData): Promise<GoalResponse> => {
      const response = await apiClient.post('/goals', data);
      return response.data;
    },

    update: async (params: {
      id: string;
      data: Partial<CreateGoalData>;
    }): Promise<GoalResponse> => {
      const response = await apiClient.patch(
        `/goals/${params.id}`,
        params.data,
      );
      return response.data;
    },

    delete: async (params: { id: string }): Promise<void> => {
      await apiClient.delete(`/goals/${params.id}`);
    },
  },

  // Questions
  questions: {
    getAll: async (): Promise<QuestionResponse[]> => {
      const response = await apiClient.get('/questions');
      return response.data;
    },

    getByGoal: async (params: {
      goalId: string;
    }): Promise<QuestionResponse[]> => {
      const response = await apiClient.get(`/questions/goal/${params.goalId}`);
      return response.data;
    },

    getById: async (params: { id: string }): Promise<QuestionResponse> => {
      const response = await apiClient.get(`/questions/${params.id}`);
      return response.data;
    },

    create: async (data: CreateQuestionData): Promise<QuestionResponse> => {
      const response = await apiClient.post('/questions', data);
      return response.data;
    },

    update: async (params: {
      id: string;
      data: Partial<CreateQuestionData>;
    }): Promise<QuestionResponse> => {
      const response = await apiClient.patch(
        `/questions/${params.id}`,
        params.data,
      );
      return response.data;
    },

    delete: async (params: { id: string }): Promise<void> => {
      await apiClient.delete(`/questions/${params.id}`);
    },
  },

  // Metrics
  metrics: {
    getAll: async (): Promise<MetricResponse[]> => {
      const response = await apiClient.get('/metrics');
      return response.data;
    },

    getByQuestion: async (params: {
      questionId: string;
    }): Promise<MetricResponse[]> => {
      const response = await apiClient.get(
        `/metrics/question/${params.questionId}`,
      );
      return response.data;
    },

    getById: async (params: { id: string }): Promise<MetricResponse> => {
      const response = await apiClient.get(`/metrics/${params.id}`);
      return response.data;
    },

    create: async (data: CreateMetricData): Promise<MetricResponse> => {
      const response = await apiClient.post('/metrics', data);
      return response.data;
    },

    update: async (params: {
      id: string;
      data: Partial<CreateMetricData>;
    }): Promise<MetricResponse> => {
      const response = await apiClient.patch(
        `/metrics/${params.id}`,
        params.data,
      );
      return response.data;
    },

    delete: async (params: { id: string }): Promise<void> => {
      await apiClient.delete(`/metrics/${params.id}`);
    },

    // Metric Data Collection
    collectData: async (params: {
      metricId: string;
      data: MetricDataEntry;
    }): Promise<MetricDataResponse> => {
      const response = await apiClient.post(
        `/metrics/${params.metricId}/data`,
        params.data,
      );
      return response.data;
    },

    getData: async (params: {
      metricId: string;
    }): Promise<MetricDataResponse[]> => {
      const response = await apiClient.get(`/metrics/${params.metricId}/data`);
      return response.data;
    },
  },

  // Objectives
  objectives: {
    getAll: async (): Promise<ObjectiveResponse[]> => {
      const response = await apiClient.get('/objectives');
      return response.data;
    },

    getById: async (params: { id: string }): Promise<ObjectiveResponse> => {
      const response = await apiClient.get(`/objectives/${params.id}`);
      return response.data;
    },

    create: async (data: CreateObjectiveData): Promise<ObjectiveResponse> => {
      const response = await apiClient.post('/objectives', data);
      return response.data;
    },

    update: async (params: {
      id: string;
      data: Partial<CreateObjectiveData>;
    }): Promise<ObjectiveResponse> => {
      const response = await apiClient.patch(
        `/objectives/${params.id}`,
        params.data,
      );
      return response.data;
    },

    delete: async (params: { id: string }): Promise<void> => {
      await apiClient.delete(`/objectives/${params.id}`);
    },
  },
};
```

### GQM Hooks

```typescript
// src/hooks/gqm/goals/useGoals.ts
import useSWR from 'swr';
import { useMutation } from '@/hooks/common/useMutation';
import { useInvalidate } from '@/hooks/common/useInvalidate';
import { gqmService } from '@/services/gqmService';
import type { CreateGoalData } from '@/schemas/gqm';
import type { UseSWROptions, UseMutationOptions } from '@/hooks/common/types';

export const useGoals = (options?: UseSWROptions) => {
  return useSWR('/goals', gqmService.goals.getAll, options);
};

export const useMyGoals = (options?: UseSWROptions) => {
  return useSWR('/goals/my-goals', gqmService.goals.getMyGoals, options);
};

export const useGoal = (params: { id: string }, options?: UseSWROptions) => {
  return useSWR(
    params.id ? `/goals/${params.id}` : null,
    () => gqmService.goals.getById(params),
    options,
  );
};

export const useCreateGoal = (
  options?: UseMutationOptions<any, CreateGoalData>,
) => {
  const { invalidateAll } = useInvalidate();

  return useMutation(gqmService.goals.create, {
    onSuccess: (data, variables) => {
      invalidateAll('/goals');
      options?.onSuccess?.(data, variables);
    },
    onError: options?.onError,
  });
};

export const useUpdateGoal = (
  options?: UseMutationOptions<
    any,
    { id: string; data: Partial<CreateGoalData> }
  >,
) => {
  const { invalidate, invalidateAll } = useInvalidate();

  return useMutation(gqmService.goals.update, {
    onSuccess: (data, variables) => {
      invalidateAll('/goals');
      invalidate(`/goals/${variables.id}`);
      options?.onSuccess?.(data, variables);
    },
    onError: options?.onError,
  });
};

export const useDeleteGoal = (
  options?: UseMutationOptions<any, { id: string }>,
) => {
  const { invalidateAll } = useInvalidate();

  return useMutation(gqmService.goals.delete, {
    onSuccess: (data, variables) => {
      invalidateAll('/goals');
      options?.onSuccess?.(data, variables);
    },
    onError: options?.onError,
  });
};

// src/hooks/gqm/questions/useQuestions.ts
import useSWR from 'swr';
import { useMutation } from '@/hooks/common/useMutation';
import { useInvalidate } from '@/hooks/common/useInvalidate';
import { gqmService } from '@/services/gqmService';
import type { CreateQuestionData } from '@/schemas/gqm';
import type { UseSWROptions, UseMutationOptions } from '@/hooks/common/types';

export const useQuestions = (options?: UseSWROptions) => {
  return useSWR('/questions', gqmService.questions.getAll, options);
};

export const useQuestionsByGoal = (
  params: { goalId: string },
  options?: UseSWROptions,
) => {
  return useSWR(
    params.goalId ? `/questions/goal/${params.goalId}` : null,
    () => gqmService.questions.getByGoal(params),
    options,
  );
};

export const useQuestion = (
  params: { id: string },
  options?: UseSWROptions,
) => {
  return useSWR(
    params.id ? `/questions/${params.id}` : null,
    () => gqmService.questions.getById(params),
    options,
  );
};

export const useCreateQuestion = (
  options?: UseMutationOptions<any, CreateQuestionData>,
) => {
  const { invalidateAll } = useInvalidate();

  return useMutation(gqmService.questions.create, {
    onSuccess: (data, variables) => {
      invalidateAll('/questions');
      invalidateAll('/questions/goal');
      options?.onSuccess?.(data, variables);
    },
    onError: options?.onError,
  });
};

// src/hooks/gqm/metrics/useMetrics.ts
import useSWR from 'swr';
import { useMutation } from '@/hooks/common/useMutation';
import { useInvalidate } from '@/hooks/common/useInvalidate';
import { gqmService } from '@/services/gqmService';
import type { CreateMetricData, MetricDataEntry } from '@/schemas/gqm';
import type { UseSWROptions, UseMutationOptions } from '@/hooks/common/types';

export const useMetrics = (options?: UseSWROptions) => {
  return useSWR('/metrics', gqmService.metrics.getAll, options);
};

export const useMetricsByQuestion = (
  params: { questionId: string },
  options?: UseSWROptions,
) => {
  return useSWR(
    params.questionId ? `/metrics/question/${params.questionId}` : null,
    () => gqmService.metrics.getByQuestion(params),
    options,
  );
};

export const useMetric = (params: { id: string }, options?: UseSWROptions) => {
  return useSWR(
    params.id ? `/metrics/${params.id}` : null,
    () => gqmService.metrics.getById(params),
    options,
  );
};

export const useMetricData = (
  params: { metricId: string },
  options?: UseSWROptions,
) => {
  return useSWR(
    params.metricId ? `/metrics/${params.metricId}/data` : null,
    () => gqmService.metrics.getData(params),
    options,
  );
};

export const useCreateMetric = (
  options?: UseMutationOptions<any, CreateMetricData>,
) => {
  const { invalidateAll } = useInvalidate();

  return useMutation(gqmService.metrics.create, {
    onSuccess: (data, variables) => {
      invalidateAll('/metrics');
      invalidateAll('/metrics/question');
      options?.onSuccess?.(data, variables);
    },
    onError: options?.onError,
  });
};

export const useCollectMetricData = (
  options?: UseMutationOptions<
    any,
    { metricId: string; data: MetricDataEntry }
  >,
) => {
  const { invalidate } = useInvalidate();

  return useMutation(gqmService.metrics.collectData, {
    onSuccess: (data, variables) => {
      invalidate(`/metrics/${variables.metricId}/data`);
      options?.onSuccess?.(data, variables);
    },
    onError: options?.onError,
  });
};

// src/hooks/gqm/objectives/useObjectives.ts
import useSWR from 'swr';
import { useMutation } from '@/hooks/common/useMutation';
import { useInvalidate } from '@/hooks/common/useInvalidate';
import { gqmService } from '@/services/gqmService';
import type { CreateObjectiveData } from '@/schemas/gqm';
import type { UseSWROptions, UseMutationOptions } from '@/hooks/common/types';

export const useObjectives = (options?: UseSWROptions) => {
  return useSWR('/objectives', gqmService.objectives.getAll, options);
};

export const useObjective = (
  params: { id: string },
  options?: UseSWROptions,
) => {
  return useSWR(
    params.id ? `/objectives/${params.id}` : null,
    () => gqmService.objectives.getById(params),
    options,
  );
};

export const useCreateObjective = (
  options?: UseMutationOptions<any, CreateObjectiveData>,
) => {
  const { invalidateAll } = useInvalidate();

  return useMutation(gqmService.objectives.create, {
    onSuccess: (data, variables) => {
      invalidateAll('/objectives');
      options?.onSuccess?.(data, variables);
    },
    onError: options?.onError,
  });
};
```

### GQM Forms

```typescript
// src/components/gqm/CreateGoalForm.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createGoalSchema, type CreateGoalData } from '@/schemas/gqm';
import { useCreateGoal } from '@/hooks/gqm/goals/useGoals';

interface CreateGoalFormProps {
  onSuccess?: (goal: any) => void;
}

export const CreateGoalForm = ({ onSuccess }: CreateGoalFormProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateGoalData>({
    resolver: zodResolver(createGoalSchema),
  });

  const createGoalMutation = useCreateGoal({
    onSuccess: (data) => {
      reset();
      onSuccess?.(data);
    },
    onError: (error) => {
      console.error('Failed to create goal:', error);
    },
  });

  const onSubmit = async (data: CreateGoalData) => {
    await createGoalMutation.mutateAsync(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <input
          {...register('name')}
          placeholder="Goal Name"
          type="text"
        />
        {errors.name && <span>{errors.name.message}</span>}
      </div>

      <div>
        <textarea
          {...register('description')}
          placeholder="Goal Description"
        />
        {errors.description && <span>{errors.description.message}</span>}
      </div>

      <div>
        <input
          {...register('organizationId')}
          placeholder="Organization ID (optional)"
          type="text"
        />
        {errors.organizationId && <span>{errors.organizationId.message}</span>}
      </div>

      <button
        type="submit"
        disabled={createGoalMutation.isPending}
      >
        {createGoalMutation.isPending ? 'Creating...' : 'Create Goal'}
      </button>

      {createGoalMutation.error && (
        <div>Error: {createGoalMutation.error.message}</div>
      )}
    </form>
  );
};

// src/components/gqm/CreateQuestionForm.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createQuestionSchema, type CreateQuestionData } from '@/schemas/gqm';
import { useCreateQuestion } from '@/hooks/gqm/questions/useQuestions';

interface CreateQuestionFormProps {
  goalId: string;
  onSuccess?: (question: any) => void;
}

export const CreateQuestionForm = ({ goalId, onSuccess }: CreateQuestionFormProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateQuestionData>({
    resolver: zodResolver(createQuestionSchema),
    defaultValues: {
      goalId,
      priority: 1,
    },
  });

  const createQuestionMutation = useCreateQuestion({
    onSuccess: (data) => {
      reset();
      onSuccess?.(data);
    },
    onError: (error) => {
      console.error('Failed to create question:', error);
    },
  });

  const onSubmit = async (data: CreateQuestionData) => {
    await createQuestionMutation.mutateAsync(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <textarea
          {...register('text')}
          placeholder="Question Text"
        />
        {errors.text && <span>{errors.text.message}</span>}
      </div>

      <div>
        <textarea
          {...register('description')}
          placeholder="Question Description"
        />
        {errors.description && <span>{errors.description.message}</span>}
      </div>

      <div>
        <select {...register('priority', { valueAsNumber: true })}>
          <option value={1}>High Priority (1)</option>
          <option value={2}>Priority 2</option>
          <option value={3}>Medium Priority (3)</option>
          <option value={4}>Priority 4</option>
          <option value={5}>Low Priority (5)</option>
        </select>
        {errors.priority && <span>{errors.priority.message}</span>}
      </div>

      <button
        type="submit"
        disabled={createQuestionMutation.isPending}
      >
        {createQuestionMutation.isPending ? 'Creating...' : 'Create Question'}
      </button>

      {createQuestionMutation.error && (
        <div>Error: {createQuestionMutation.error.message}</div>
      )}
    </form>
  );
};

// src/components/gqm/CreateMetricForm.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createMetricSchema, type CreateMetricData } from '@/schemas/gqm';
import { useCreateMetric } from '@/hooks/gqm/metrics/useMetrics';

interface CreateMetricFormProps {
  questionId: string;
  onSuccess?: (metric: any) => void;
}

export const CreateMetricForm = ({ questionId, onSuccess }: CreateMetricFormProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm<CreateMetricData>({
    resolver: zodResolver(createMetricSchema),
    defaultValues: {
      questionId,
      type: 'QUANTITATIVE',
      unit: 'COUNT',
    },
  });

  const selectedUnit = watch('unit');

  const createMetricMutation = useCreateMetric({
    onSuccess: (data) => {
      reset();
      onSuccess?.(data);
    },
    onError: (error) => {
      console.error('Failed to create metric:', error);
    },
  });

  const onSubmit = async (data: CreateMetricData) => {
    await createMetricMutation.mutateAsync(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <input
          {...register('name')}
          placeholder="Metric Name"
          type="text"
        />
        {errors.name && <span>{errors.name.message}</span>}
      </div>

      <div>
        <textarea
          {...register('description')}
          placeholder="Metric Description"
        />
        {errors.description && <span>{errors.description.message}</span>}
      </div>

      <div>
        <select {...register('type')}>
          <option value="QUANTITATIVE">Quantitative</option>
          <option value="QUALITATIVE">Qualitative</option>
        </select>
        {errors.type && <span>{errors.type.message}</span>}
      </div>

      <div>
        <select {...register('unit')}>
          <option value="COUNT">Count</option>
          <option value="PERCENTAGE">Percentage</option>
          <option value="TIME">Time</option>
          <option value="SIZE">Size</option>
          <option value="CUSTOM">Custom</option>
        </select>
        {errors.unit && <span>{errors.unit.message}</span>}
      </div>

      {selectedUnit === 'CUSTOM' && (
        <div>
          <input
            {...register('customUnitLabel')}
            placeholder="Custom Unit Label"
            type="text"
          />
          {errors.customUnitLabel && <span>{errors.customUnitLabel.message}</span>}
        </div>
      )}

      <div>
        <textarea
          {...register('formula')}
          placeholder="Formula (optional)"
        />
        {errors.formula && <span>{errors.formula.message}</span>}
      </div>

      <div>
        <input
          {...register('targetValue', { valueAsNumber: true })}
          placeholder="Target Value (optional)"
          type="number"
        />
        {errors.targetValue && <span>{errors.targetValue.message}</span>}
      </div>

      <div>
        <input
          {...register('frequency')}
          placeholder="Collection Frequency (optional)"
          type="text"
        />
        {errors.frequency && <span>{errors.frequency.message}</span>}
      </div>

      <button
        type="submit"
        disabled={createMetricMutation.isPending}
      >
        {createMetricMutation.isPending ? 'Creating...' : 'Create Metric'}
      </button>

      {createMetricMutation.error && (
        <div>Error: {createMetricMutation.error.message}</div>
      )}
    </form>
  );
};
```

---

## Measurement Plans

### Plans Zod Schemas

```typescript
// src/schemas/plans.ts
import { z } from 'zod';

export const createPlanSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').max(100),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(1000),
  goalIds: z.array(z.string()).min(1, 'At least one goal must be selected'),
  objectiveIds: z.array(z.string()).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  organizationId: z.string().optional(),
});

export const updatePlanSchema = createPlanSchema.partial();

export const importPlanSchema = z.object({
  content: z.string().min(1, 'Plan content is required'),
});

export type CreatePlanData = z.infer<typeof createPlanSchema>;
export type UpdatePlanData = z.infer<typeof updatePlanSchema>;
export type ImportPlanData = z.infer<typeof importPlanSchema>;
```

### Plans Service

```typescript
// src/services/plansService.ts
import { apiClient } from '@/lib/axios';
import type {
  CreatePlanData,
  UpdatePlanData,
  ImportPlanData,
} from '@/schemas/plans';

export interface PlanResponse {
  id: string;
  name: string;
  description: string;
  goalIds: string[];
  goals?: any[];
  objectiveIds: string[];
  objectives?: any[];
  status: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  startDate?: string;
  endDate?: string;
  approvedBy?: string;
  approvedDate?: string;
  organizationId?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface PlanVersionResponse {
  id: string;
  planId: string;
  version: number;
  data: any;
  createdBy: string;
  createdAt: string;
}

export const plansService = {
  getAll: async (params?: {
    goalId?: string;
    objectiveId?: string;
    organizationId?: string;
  }): Promise<PlanResponse[]> => {
    const response = await apiClient.get('/plans', { params });
    return response.data;
  },

  getById: async (params: { id: string }): Promise<PlanResponse> => {
    const response = await apiClient.get(`/plans/${params.id}`);
    return response.data;
  },

  create: async (data: CreatePlanData): Promise<PlanResponse> => {
    const response = await apiClient.post('/plans', data);
    return response.data;
  },

  update: async (params: {
    id: string;
    data: UpdatePlanData;
  }): Promise<PlanResponse> => {
    const response = await apiClient.put(`/plans/${params.id}`, params.data);
    return response.data;
  },

  delete: async (params: { id: string }): Promise<void> => {
    await apiClient.delete(`/plans/${params.id}`);
  },

  // Versioning
  getVersions: async (params: {
    id: string;
  }): Promise<PlanVersionResponse[]> => {
    const response = await apiClient.get(`/plans/${params.id}/versions`);
    return response.data;
  },

  createVersion: async (params: { id: string }): Promise<PlanResponse> => {
    const response = await apiClient.post(`/plans/${params.id}/versions`);
    return response.data;
  },

  // Export/Import
  exportPlan: async (params: { id: string }): Promise<Blob> => {
    const response = await apiClient.get(`/plans/export/${params.id}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  importPlan: async (data: ImportPlanData): Promise<PlanResponse> => {
    const response = await apiClient.post('/plans/import', data);
    return response.data;
  },
};
```

### Plans Hooks

```typescript
// src/hooks/plans/usePlans.ts
import useSWR from 'swr';
import { useMutation } from '@/hooks/common/useMutation';
import { useInvalidate } from '@/hooks/common/useInvalidate';
import { plansService } from '@/services/plansService';
import type {
  CreatePlanData,
  UpdatePlanData,
  ImportPlanData,
} from '@/schemas/plans';
import type { UseSWROptions, UseMutationOptions } from '@/hooks/common/types';

export const usePlans = (
  params?: {
    goalId?: string;
    objectiveId?: string;
    organizationId?: string;
  },
  options?: UseSWROptions,
) => {
  const queryKey = params
    ? `/plans?${new URLSearchParams(params as Record<string, string>).toString()}`
    : '/plans';

  return useSWR(queryKey, () => plansService.getAll(params), options);
};

export const usePlan = (params: { id: string }, options?: UseSWROptions) => {
  return useSWR(
    params.id ? `/plans/${params.id}` : null,
    () => plansService.getById(params),
    options,
  );
};

export const usePlanVersions = (
  params: { id: string },
  options?: UseSWROptions,
) => {
  return useSWR(
    params.id ? `/plans/${params.id}/versions` : null,
    () => plansService.getVersions(params),
    options,
  );
};

export const useCreatePlan = (
  options?: UseMutationOptions<any, CreatePlanData>,
) => {
  const { invalidateAll } = useInvalidate();

  return useMutation(plansService.create, {
    onSuccess: (data, variables) => {
      invalidateAll('/plans');
      options?.onSuccess?.(data, variables);
    },
    onError: options?.onError,
  });
};

export const useUpdatePlan = (
  options?: UseMutationOptions<any, { id: string; data: UpdatePlanData }>,
) => {
  const { invalidate, invalidateAll } = useInvalidate();

  return useMutation(plansService.update, {
    onSuccess: (data, variables) => {
      invalidateAll('/plans');
      invalidate(`/plans/${variables.id}`);
      options?.onSuccess?.(data, variables);
    },
    onError: options?.onError,
  });
};

export const useDeletePlan = (
  options?: UseMutationOptions<any, { id: string }>,
) => {
  const { invalidateAll } = useInvalidate();

  return useMutation(plansService.delete, {
    onSuccess: (data, variables) => {
      invalidateAll('/plans');
      options?.onSuccess?.(data, variables);
    },
    onError: options?.onError,
  });
};

export const useCreatePlanVersion = (
  options?: UseMutationOptions<any, { id: string }>,
) => {
  const { invalidate, invalidateAll } = useInvalidate();

  return useMutation(plansService.createVersion, {
    onSuccess: (data, variables) => {
      invalidateAll('/plans');
      invalidate(`/plans/${variables.id}`);
      invalidate(`/plans/${variables.id}/versions`);
      options?.onSuccess?.(data, variables);
    },
    onError: options?.onError,
  });
};

export const useExportPlan = (
  options?: UseMutationOptions<any, { id: string }>,
) => {
  return useMutation(plansService.exportPlan, {
    onSuccess: (blob, variables) => {
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `plan-${variables.id}.json`;
      link.click();
      window.URL.revokeObjectURL(url);
      options?.onSuccess?.(blob, variables);
    },
    onError: options?.onError,
  });
};

export const useImportPlan = (
  options?: UseMutationOptions<any, ImportPlanData>,
) => {
  const { invalidateAll } = useInvalidate();

  return useMutation(plansService.importPlan, {
    onSuccess: (data, variables) => {
      invalidateAll('/plans');
      options?.onSuccess?.(data, variables);
    },
    onError: options?.onError,
  });
};
```

### Plans Forms

```typescript
// src/components/plans/CreatePlanForm.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createPlanSchema, type CreatePlanData } from '@/schemas/plans';
import { useCreatePlan } from '@/hooks/plans/usePlans';
import { useGoals } from '@/hooks/gqm/goals/useGoals';
import { useObjectives } from '@/hooks/gqm/objectives/useObjectives';

interface CreatePlanFormProps {
  onSuccess?: (plan: any) => void;
}

export const CreatePlanForm = ({ onSuccess }: CreatePlanFormProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm<CreatePlanData>({
    resolver: zodResolver(createPlanSchema),
  });

  const { data: goals } = useGoals();
  const { data: objectives } = useObjectives();

  const createPlanMutation = useCreatePlan({
    onSuccess: (data) => {
      reset();
      onSuccess?.(data);
    },
    onError: (error) => {
      console.error('Failed to create plan:', error);
    },
  });

  const onSubmit = async (data: CreatePlanData) => {
    await createPlanMutation.mutateAsync(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <input
          {...register('name')}
          placeholder="Plan Name"
          type="text"
        />
        {errors.name && <span>{errors.name.message}</span>}
      </div>

      <div>
        <textarea
          {...register('description')}
          placeholder="Plan Description"
        />
        {errors.description && <span>{errors.description.message}</span>}
      </div>

      <div>
        <label>Goals</label>
        <select {...register('goalIds')} multiple>
          {goals?.map((goal) => (
            <option key={goal.id} value={goal.id}>
              {goal.name}
            </option>
          ))}
        </select>
        {errors.goalIds && <span>{errors.goalIds.message}</span>}
      </div>

      <div>
        <label>Objectives (optional)</label>
        <select {...register('objectiveIds')} multiple>
          {objectives?.map((objective) => (
            <option key={objective.id} value={objective.id}>
              {objective.name}
            </option>
          ))}
        </select>
        {errors.objectiveIds && <span>{errors.objectiveIds.message}</span>}
      </div>

      <div>
        <input
          {...register('startDate')}
          placeholder="Start Date"
          type="date"
        />
        {errors.startDate && <span>{errors.startDate.message}</span>}
      </div>

      <div>
        <input
          {...register('endDate')}
          placeholder="End Date"
          type="date"
        />
        {errors.endDate && <span>{errors.endDate.message}</span>}
      </div>

      <button
        type="submit"
        disabled={createPlanMutation.isPending}
      >
        {createPlanMutation.isPending ? 'Creating...' : 'Create Plan'}
      </button>

      {createPlanMutation.error && (
        <div>Error: {createPlanMutation.error.message}</div>
      )}
    </form>
  );
};
```

---

## Error Handling

### Enhanced Error Handling with SWR

```typescript
// src/lib/errorHandler.ts
import { AxiosError } from 'axios';

export interface ApiError {
  statusCode: number;
  message: string | string[];
  error: string;
  timestamp: string;
  path: string;
}

export const handleApiError = (error: AxiosError<ApiError>) => {
  const { response, request } = error;

  if (response) {
    // Server responded with error status
    const { status, data } = response;

    switch (status) {
      case 400:
        console.error('Validation failed:', data.message);
        return {
          type: 'validation',
          message: Array.isArray(data.message)
            ? data.message.join(', ')
            : data.message,
        };
      case 401:
        console.error('Unauthorized:', data.message);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return {
          type: 'auth',
          message: 'Session expired. Please log in again.',
        };
      case 403:
        console.error('Forbidden:', data.message);
        return {
          type: 'permission',
          message:
            'Access denied. You do not have permission to perform this action.',
        };
      case 404:
        console.error('Not found:', data.message);
        return {
          type: 'notFound',
          message: 'The requested resource was not found.',
        };
      case 409:
        console.error('Conflict:', data.message);
        return {
          type: 'conflict',
          message: 'A conflict occurred. The resource may already exist.',
        };
      case 429:
        console.error('Rate limited:', data.message);
        return {
          type: 'rateLimit',
          message: 'Too many requests. Please try again later.',
        };
      case 500:
        console.error('Server error:', data.message);
        return {
          type: 'server',
          message: 'Internal server error. Please try again later.',
        };
      default:
        console.error('Unexpected error:', data.message);
        return {
          type: 'unknown',
          message: 'An unexpected error occurred.',
        };
    }
  } else if (request) {
    // Network error
    console.error('Network error:', error.message);
    return {
      type: 'network',
      message: 'Network error. Please check your connection.',
    };
  } else {
    // Other error
    console.error('Error:', error.message);
    return {
      type: 'unknown',
      message: error.message || 'An unexpected error occurred.',
    };
  }
};

// src/hooks/common/useErrorHandler.ts
import { useCallback } from 'react';
import { AxiosError } from 'axios';
import { handleApiError, type ApiError } from '@/lib/errorHandler';

export const useErrorHandler = () => {
  const handleError = useCallback((error: AxiosError<ApiError>) => {
    return handleApiError(error);
  }, []);

  return { handleError };
};
```

### Global Error Boundary with SWR

```typescript
// src/components/ErrorBoundary.tsx
import React from 'react';
import { SWRConfig } from 'swr';
import { handleApiError } from '@/lib/errorHandler';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<
  React.PropsWithChildren<{}>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>Something went wrong.</h2>
          <details>
            {this.state.error && this.state.error.toString()}
          </details>
        </div>
      );
    }

    return (
      <SWRConfig
        value={{
          onError: (error) => {
            handleApiError(error);
          },
          shouldRetryOnError: (error) => {
            // Don't retry on 4xx errors
            if (error.response?.status >= 400 && error.response?.status < 500) {
              return false;
            }
            return true;
          },
        }}
      >
        {this.props.children}
      </SWRConfig>
    );
  }
}
```

---

## Form Validation with Zod

### Advanced Form Patterns

```typescript
// src/hooks/forms/useZodForm.ts
import { useForm, UseFormProps } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

export const useZodForm = <T extends z.ZodType<any, any>>(
  schema: T,
  options?: UseFormProps<z.infer<T>>
) => {
  const form = useForm<z.infer<T>>({
    resolver: zodResolver(schema),
    ...options,
  });

  return form;
};

// Usage example
const MyForm = () => {
  const form = useZodForm(createEstimateSchema, {
    defaultValues: {
      name: '',
      description: '',
      projectId: '',
    },
  });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* form fields */}
    </form>
  );
};
```

---

## Integration Examples

### Complete FPA Estimate Workflow with SWR

```typescript
// src/components/fpa/EstimateWorkflow.tsx
import React, { useState } from 'react';
import { useCreateEstimate } from '@/hooks/fpa/estimates/useCreateEstimate';
import { useCreateALI } from '@/hooks/fpa/components/useALI';
import { useCreateEI } from '@/hooks/fpa/components/useEI';
import { useCalculateFunctionPoints } from '@/hooks/fpa/calculations/useCalculations';

export const EstimateWorkflow = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [estimateId, setEstimateId] = useState<string | null>(null);

  const createEstimate = useCreateEstimate({
    onSuccess: (data) => {
      setEstimateId(data.id);
      setCurrentStep(1);
    },
  });

  const createALI = useCreateALI({
    onSuccess: () => {
      setCurrentStep(2);
    },
  });

  const createEI = useCreateEI({
    onSuccess: () => {
      setCurrentStep(3);
    },
  });

  const calculatePoints = useCalculateFunctionPoints({
    onSuccess: (data) => {
      console.log('Calculation complete:', data);
    },
  });

  const steps = [
    {
      title: 'Create Estimate',
      component: (
        <button
          onClick={() =>
            createEstimate.mutateAsync({
              name: 'Sample Estimate',
              description: 'Sample description',
              projectId: 'project-123',
            })
          }
          disabled={createEstimate.isPending}
        >
          {createEstimate.isPending ? 'Creating...' : 'Create Estimate'}
        </button>
      ),
    },
    {
      title: 'Add ALI Components',
      component: estimateId ? (
        <button
          onClick={() =>
            createALI.mutateAsync({
              estimateId,
              data: {
                name: 'Sample ALI',
                description: 'Sample ALI description',
                recordElementTypes: 2,
                dataElementTypes: 10,
              },
            })
          }
          disabled={createALI.isPending}
        >
          {createALI.isPending ? 'Adding...' : 'Add ALI'}
        </button>
      ) : null,
    },
    {
      title: 'Add EI Components',
      component: estimateId ? (
        <button
          onClick={() =>
            createEI.mutateAsync({
              estimateId,
              data: {
                name: 'Sample EI',
                description: 'Sample EI description',
                fileTypesReferenced: 1,
                dataElementTypes: 8,
              },
            })
          }
          disabled={createEI.isPending}
        >
          {createEI.isPending ? 'Adding...' : 'Add EI'}
        </button>
      ) : null,
    },
    {
      title: 'Calculate Function Points',
      component: estimateId ? (
        <button
          onClick={() =>
            calculatePoints.mutateAsync({ estimateId })
          }
          disabled={calculatePoints.isPending}
        >
          {calculatePoints.isPending ? 'Calculating...' : 'Calculate'}
        </button>
      ) : null,
    },
  ];

  return (
    <div className="estimate-workflow">
      <h2>FPA Estimate Workflow</h2>
      {steps.map((step, index) => (
        <div
          key={index}
          className={`step ${index === currentStep ? 'active' : ''} ${
            index < currentStep ? 'completed' : ''
          }`}
        >
          <h3>{step.title}</h3>
          {step.component}
        </div>
      ))}
    </div>
  );
};
```

### Complete GQM Workflow with SWR

```typescript
// src/components/gqm/GQMWorkflow.tsx
import React, { useState } from 'react';
import { useCreateGoal } from '@/hooks/gqm/goals/useGoals';
import { useCreateQuestion } from '@/hooks/gqm/questions/useQuestions';
import { useCreateMetric } from '@/hooks/gqm/metrics/useMetrics';
import { useCollectMetricData } from '@/hooks/gqm/metrics/useMetrics';

export const GQMWorkflow = () => {
  const [goalId, setGoalId] = useState<string | null>(null);
  const [questionId, setQuestionId] = useState<string | null>(null);
  const [metricId, setMetricId] = useState<string | null>(null);

  const createGoal = useCreateGoal({
    onSuccess: (data) => {
      setGoalId(data.id);
    },
  });

  const createQuestion = useCreateQuestion({
    onSuccess: (data) => {
      setQuestionId(data.id);
    },
  });

  const createMetric = useCreateMetric({
    onSuccess: (data) => {
      setMetricId(data.id);
    },
  });

  const collectData = useCollectMetricData({
    onSuccess: () => {
      console.log('Data collected successfully');
    },
  });

  const handleCreateGQMStructure = async () => {
    try {
      // Step 1: Create Goal
      const goal = await createGoal.mutateAsync({
        name: 'Improve Software Quality',
        description: 'Reduce defects in production software',
      });

      // Step 2: Create Question
      const question = await createQuestion.mutateAsync({
        text: 'How many defects are found in testing?',
        description: 'Track defects discovered during testing phase',
        goalId: goal.id,
        priority: 1,
      });

      // Step 3: Create Metric
      const metric = await createMetric.mutateAsync({
        name: 'Defect Count',
        description: 'Number of defects found during testing',
        questionId: question.id,
        type: 'QUANTITATIVE',
        unit: 'COUNT',
        targetValue: 0,
      });

      // Step 4: Collect sample data
      await collectData.mutateAsync({
        metricId: metric.id,
        data: {
          value: 5,
          notes: 'Initial measurement',
        },
      });

      console.log('GQM structure created successfully');
    } catch (error) {
      console.error('Failed to create GQM structure:', error);
    }
  };

  return (
    <div className="gqm-workflow">
      <h2>GQM Workflow</h2>
      <button
        onClick={handleCreateGQMStructure}
        disabled={
          createGoal.isPending ||
          createQuestion.isPending ||
          createMetric.isPending ||
          collectData.isPending
        }
      >
        {createGoal.isPending ||
        createQuestion.isPending ||
        createMetric.isPending ||
        collectData.isPending
          ? 'Creating GQM Structure...'
          : 'Create Complete GQM Structure'}
      </button>

      <div className="status">
        <p>Goal: {goalId ? '✅ Created' : '⏳ Pending'}</p>
        <p>Question: {questionId ? '✅ Created' : '⏳ Pending'}</p>
        <p>Metric: {metricId ? '✅ Created' : '⏳ Pending'}</p>
      </div>
    </div>
  );
};
```

---

## File Upload Guidelines

### File Upload with Progress using SWR

```typescript
// src/hooks/uploads/useFileUpload.ts
import { useState } from 'react';
import { apiClient } from '@/lib/axios';
import { mutate } from 'swr';

interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export const useFileUpload = () => {
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const uploadFile = async (
    file: File,
    params: {
      estimateId: string;
      description?: string;
      onProgress?: (progress: UploadProgress) => void;
    }
  ) => {
    setIsUploading(true);
    setError(null);
    setProgress(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('estimateId', params.estimateId);
    formData.append('name', file.name);
    if (params.description) {
      formData.append('description', params.description);
    }

    try {
      const response = await apiClient.post(
        '/estimates/documents/upload',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            const { loaded, total } = progressEvent;
            const percentage = total ? Math.round((loaded * 100) / total) : 0;
            const progressData = { loaded, total: total || 0, percentage };

            setProgress(progressData);
            params.onProgress?.(progressData);
          },
        }
      );

      // Invalidate documents cache
      mutate(`/estimates/${params.estimateId}/documents`);

      return response.data;
    } catch (err) {
      const error = err as Error;
      setError(error);
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  return {
    uploadFile,
    progress,
    isUploading,
    error,
  };
};

// Usage example
const FileUploadComponent = ({ estimateId }: { estimateId: string }) => {
  const { uploadFile, progress, isUploading, error } = useFileUpload();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      await uploadFile(file, {
        estimateId,
        description: 'Project documentation',
        onProgress: (progress) => {
          console.log(`Upload progress: ${progress.percentage}%`);
        },
      });
      console.log('File uploaded successfully');
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  return (
    <div>
      <input type="file" onChange={handleFileSelect} disabled={isUploading} />
      {progress && (
        <div>
          <div>Progress: {progress.percentage}%</div>
          <progress value={progress.loaded} max={progress.total} />
        </div>
      )}
      {error && <div>Error: {error.message}</div>}
    </div>
  );
};
```

---

This guide provides comprehensive coverage of all available endpoints and integration patterns using SWR for data fetching and state management. The patterns shown can be applied consistently across your entire application for maintainable and scalable code.

## Role-Based Access Summary

| Endpoint Group    | USER | PROJECT_MANAGER | MEASUREMENT_ANALYST | ADMIN     |
| ----------------- | ---- | --------------- | ------------------- | --------- |
| Auth              | ✅   | ✅              | ✅                  | ✅        |
| Own Profile       | ✅   | ✅              | ✅                  | ✅        |
| User Management   | ❌   | ✅ (Read)       | ❌                  | ✅ (Full) |
| FPA Estimates     | ✅   | ✅              | ✅                  | ✅        |
| FPA Components    | ✅   | ✅              | ✅                  | ✅        |
| GQM Goals         | ✅   | ✅              | ✅                  | ✅        |
| GQM Questions     | ✅   | ✅              | ✅                  | ✅        |
| GQM Metrics       | ✅   | ✅              | ✅                  | ✅        |
| GQM Objectives    | ✅   | ✅              | ✅                  | ✅        |
| Measurement Plans | ✅   | ✅              | ✅                  | ✅        |
| Reports           | ✅   | ✅              | ✅                  | ✅        |

Note: Users can only access/modify resources they created unless they have elevated permissions.

---

## 📋 Implementation Task Breakdown

### **Phase 1: Project Foundation & Setup**

#### Task 1.1: Project Dependencies & Configuration

- [ ] Install required dependencies: `npm install axios swr zod react-hook-form @hookform/resolvers`
- [ ] Set up environment variables (`.env` file with `REACT_APP_API_BASE_URL`)
- [ ] Configure TypeScript paths in `tsconfig.json` for clean imports (@/lib, @/hooks, etc.)

#### Task 1.2: Axios Setup & Configuration

- [ ] Create `src/lib/axios.ts` with base configuration
- [ ] Implement request interceptor for authentication tokens
- [ ] Implement response interceptor for automatic token refresh
- [ ] Add proper error handling and token management

#### Task 1.3: SWR Configuration & Provider

- [ ] Create `src/lib/swr.ts` with global SWR configuration
- [ ] Implement `SWRProvider` component
- [ ] Configure default fetcher function
- [ ] Set up retry and revalidation policies

---

### **Phase 2: Common Utilities & Base Hooks**

#### Task 2.1: Common Types & Interfaces

- [ ] Create `src/hooks/common/types.ts` with base interfaces
- [ ] Define `UseSWROptions` and `UseMutationOptions` interfaces
- [ ] Set up common error types

#### Task 2.2: Custom Mutation Hook

- [ ] Implement `src/hooks/common/useMutation.ts`
- [ ] Add loading states, error handling, and success callbacks
- [ ] Include proper TypeScript generics for type safety

#### Task 2.3: Cache Invalidation Hook

- [ ] Create `src/hooks/common/useInvalidate.ts`
- [ ] Implement `invalidate` and `invalidateAll` functions
- [ ] Add pattern-based cache invalidation

#### Task 2.4: Error Handling System

- [ ] Create `src/lib/errorHandler.ts` with comprehensive error handling
- [ ] Implement `useErrorHandler` hook
- [ ] Set up global error boundary with SWR integration

---

### **Phase 3: Authentication System**

#### Task 3.1: Authentication Schemas

- [ ] Create `src/schemas/auth.ts` with Zod validation schemas
- [ ] Define `registerSchema`, `loginSchema`, `passwordResetSchema`
- [ ] Export TypeScript types from schemas

#### Task 3.2: Authentication Service

- [ ] Implement `src/services/authService.ts` with all auth endpoints
- [ ] Add register, login, firebase-login, refresh-token methods
- [ ] Include password reset and email verification functions

#### Task 3.3: Authentication State Management

- [ ] Create `src/hooks/auth/useAuth.ts` with Zustand store
- [ ] Implement persistent authentication state
- [ ] Add login/logout actions and user state management

#### Task 3.4: Authentication Hooks

- [ ] Create `src/hooks/auth/useLogin.ts` and `useRegister.ts`
- [ ] Implement `src/hooks/auth/usePasswordReset.ts`
- [ ] Add proper cache invalidation and state updates

#### Task 3.5: Authentication Forms

- [ ] Create `src/components/auth/LoginForm.tsx`
- [ ] Create `src/components/auth/RegisterForm.tsx`
- [ ] Add proper validation, loading states, and error handling

---

### **Phase 4: User Management System**

#### Task 4.1: User Service & Types

- [ ] Create `src/services/userService.ts` with user management endpoints
- [ ] Define user interfaces and data types
- [ ] Implement CRUD operations for users

#### Task 4.2: User Management Hooks

- [ ] Create `src/hooks/users/useUsers.ts` for fetching all users
- [ ] Implement `src/hooks/users/useUserProfile.ts` for current user
- [ ] Add `src/hooks/users/useUser.ts` for individual user lookup
- [ ] Create mutation hooks for user creation and updates

---

### **Phase 5: FPA System Implementation**

#### Task 5.1: FPA Schemas & Validation

- [ ] Create `src/schemas/fpa.ts` with all FPA-related schemas
- [ ] Define estimate, ALI, EI, EO, EQ, AIE creation schemas
- [ ] Add comprehensive validation rules

#### Task 5.2: FPA Services

- [ ] Implement `src/services/estimateService.ts` for estimate management
- [ ] Create `src/services/fpaComponentService.ts` for all component types
- [ ] Add calculation and versioning endpoints

#### Task 5.3: Estimate Management Hooks

- [ ] Create `src/hooks/fpa/estimates/useEstimates.ts`
- [ ] Implement `src/hooks/fpa/estimates/useEstimate.ts`
- [ ] Add creation, update, and deletion hooks

#### Task 5.4: FPA Component Hooks

- [ ] Create `src/hooks/fpa/components/useALI.ts`
- [ ] Implement hooks for EI, EO, EQ, AIE components
- [ ] Add CRUD operations for each component type

#### Task 5.5: FPA Calculation Hooks

- [ ] Create `src/hooks/fpa/calculations/useCalculations.ts`
- [ ] Implement function point calculation logic
- [ ] Add proper cache invalidation after calculations

#### Task 5.6: FPA Forms & Components

- [ ] Create `src/components/fpa/CreateEstimateForm.tsx`
- [ ] Implement component creation forms (ALI, EI, EO, EQ, AIE)
- [ ] Add validation and error handling to all forms

---

### **Phase 6: GQM System Implementation**

#### Task 6.1: GQM Schemas & Validation

- [ ] Create `src/schemas/gqm.ts` with goal, question, metric schemas
- [ ] Define objective and metric data collection schemas
- [ ] Add complex validation rules (custom units, etc.)

#### Task 6.2: GQM Service Implementation

- [ ] Create `src/services/gqmService.ts` with all GQM endpoints
- [ ] Implement goals, questions, metrics, objectives services
- [ ] Add metric data collection functionality

#### Task 6.3: Goals Management Hooks

- [ ] Create `src/hooks/gqm/goals/useGoals.ts`
- [ ] Implement CRUD operations for goals
- [ ] Add personal goals management

#### Task 6.4: Questions Management Hooks

- [ ] Create `src/hooks/gqm/questions/useQuestions.ts`
- [ ] Implement question-to-goal relationship management
- [ ] Add priority and filtering capabilities

#### Task 6.5: Metrics Management Hooks

- [ ] Create `src/hooks/gqm/metrics/useMetrics.ts`
- [ ] Implement metric data collection hooks
- [ ] Add data aggregation and reporting

#### Task 6.6: Objectives Management Hooks

- [ ] Create `src/hooks/gqm/objectives/useObjectives.ts`
- [ ] Implement multi-goal objective management
- [ ] Add relationship tracking

#### Task 6.7: GQM Forms & Components

- [ ] Create goal, question, metric creation forms
- [ ] Implement metric data collection interfaces
- [ ] Add relationship selection components

---

### **Phase 7: Measurement Plans System**

#### Task 7.1: Plans Schemas & Service

- [ ] Create `src/schemas/plans.ts` with plan validation
- [ ] Implement `src/services/plansService.ts`
- [ ] Add versioning, export/import functionality

#### Task 7.2: Plans Management Hooks

- [ ] Create `src/hooks/plans/usePlans.ts`
- [ ] Implement plan CRUD operations
- [ ] Add versioning and history management

#### Task 7.3: Plans Forms & Components

- [ ] Create plan creation and editing forms
- [ ] Implement goal/objective selection interfaces
- [ ] Add export/import functionality

---

### **Phase 8: Advanced Features & File Handling**

#### Task 8.1: File Upload System

- [ ] Create `src/hooks/uploads/useFileUpload.ts`
- [ ] Implement progress tracking and error handling
- [ ] Add automatic cache invalidation

#### Task 8.2: Form Utilities

- [ ] Create `src/hooks/forms/useZodForm.ts`
- [ ] Implement reusable form patterns
- [ ] Add consistent validation handling

---

### **Phase 9: Integration Examples & Workflows**

#### Task 9.1: FPA Workflow Component

- [ ] Create `src/components/fpa/EstimateWorkflow.tsx`
- [ ] Implement step-by-step estimate creation
- [ ] Add progress tracking and state management

#### Task 9.2: GQM Workflow Component

- [ ] Create `src/components/gqm/GQMWorkflow.tsx`
- [ ] Implement complete goal-to-metric workflow
- [ ] Add status tracking and validation

---

### **Phase 10: Testing & Documentation**

#### Task 10.1: Component Testing

- [ ] Set up testing framework (Jest + React Testing Library)
- [ ] Write unit tests for all custom hooks
- [ ] Add integration tests for workflows

#### Task 10.2: Type Safety & Error Handling

- [ ] Verify all TypeScript interfaces are properly typed
- [ ] Test error scenarios and edge cases
- [ ] Add proper error boundaries throughout the app

#### Task 10.3: Performance Optimization

- [ ] Implement proper memoization where needed
- [ ] Optimize SWR cache invalidation patterns
- [ ] Add loading states and skeleton screens

---

## 🚀 **Quick Start Implementation Order**

### **Week 1: Foundation**

- Tasks 1.1 → 1.3 (Project setup)
- Tasks 2.1 → 2.4 (Common utilities)

### **Week 2: Authentication**

- Tasks 3.1 → 3.5 (Complete auth system)
- Task 4.1 → 4.2 (Basic user management)

### **Week 3: Core FPA Features**

- Tasks 5.1 → 5.3 (Estimates)
- Tasks 5.4 → 5.6 (Components)

### **Week 4: GQM System**

- Tasks 6.1 → 6.2 (GQM foundation)
- Tasks 6.3 → 6.7 (Complete GQM)

### **Week 5: Plans & Advanced Features**

- Tasks 7.1 → 7.3 (Measurement plans)
- Tasks 8.1 → 8.2 (File handling)

### **Week 6: Integration & Polish**

- Tasks 9.1 → 9.2 (Workflows)
- Tasks 10.1 → 10.3 (Testing & optimization)

---

## 📝 **Implementation Notes**

### **Critical Dependencies Between Tasks:**

- Tasks 1.x must be completed before any other phase
- Task 2.x must be completed before implementing hooks
- Authentication (3.x) should be completed before user management (4.x)
- Services must be implemented before their corresponding hooks
- Forms should be implemented after their corresponding hooks

### **Parallel Development Opportunities:**

- FPA (Phase 5) and GQM (Phase 6) can be developed in parallel
- Forms can be developed in parallel with hook implementation
- Testing can be written alongside feature development

### **Key Validation Points:**

- After Phase 2: All base utilities should be working
- After Phase 3: Authentication flow should be complete
- After Phase 5: Basic FPA workflow should be functional
- After Phase 6: Complete GQM system should work end-to-end
- After Phase 9: All major workflows should be integrated

This task breakdown provides a clear roadmap for implementing the entire frontend integration systematically, with each task being focused enough for a single development session while building toward a complete, production-ready application.
