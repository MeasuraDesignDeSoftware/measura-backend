# Frontend Integration Guide - FPA Estimation System

## Overview

This guide provides complete API documentation for integrating the Function Point Analysis (FPA) estimation system into your frontend application.

## Authentication

All endpoints require JWT authentication via Bearer token:

```typescript
headers: {
  'Authorization': 'Bearer YOUR_JWT_TOKEN'
}
```

## API Base URL

```
http://localhost:8080
```

---

## 1. ESTIMATE MANAGEMENT

### 1.1 List All Estimates

```typescript
GET /estimates
// Optional query parameter:
GET /estimates?projectId={projectId}

Response: Estimate[]
```

### 1.2 Get Estimate Details

```typescript
GET / estimates / { id };

Response: {
  _id: string;
  name: string;
  description: string;
  status: 'DRAFT' | 'FINALIZED' | 'ARCHIVED';
  countType: 'DEVELOPMENT_PROJECT' |
    'ENHANCEMENT_PROJECT' |
    'APPLICATION_BASELINE';
  applicationBoundary: string;
  countingScope: string;
  // ... other fields
}
```

### 1.3 Get Estimate Overview (Dashboard Data)

```typescript
GET / estimates / { id } / overview;

Response: {
  // Basic info
  id: string;
  name: string;
  description: string;
  status: string;
  version: number;

  // Function Point Summary
  functionPointSummary: {
    unadjustedFunctionPoints: number;
    valueAdjustmentFactor: number;
    adjustedFunctionPoints: number;
  }

  // Component counts
  componentCounts: {
    internalLogicalFiles: number;
    externalInterfaceFiles: number;
    externalInputs: number;
    externalOutputs: number;
    externalQueries: number;
    totalComponents: number;
  }

  // Effort estimation
  estimation: {
    productivityFactor: number;
    estimatedEffortHours: number;
    estimatedEffortDays: number;
    estimatedEffortMonths: number;
    estimatedCost: number | null;
  }
}
```

### 1.4 Create Estimate

```typescript
POST /estimates

Body: {
  name: string
  description: string
  projectId: string
  countType: string
  applicationBoundary: string
  countingScope: string
  productivityFactor?: number
  hourlyRate?: number
}

Response: Estimate
```

### 1.5 Update Estimate

```typescript
PUT /estimates/{id}

Body: {
  name?: string
  description?: string
  applicationBoundary?: string
  countingScope?: string
  productivityFactor?: number
  hourlyRate?: number
  status?: string
}

Response: Estimate
```

### 1.6 Delete Estimate

```typescript
DELETE / estimates / { id };

Response: {
  success: boolean;
}
```

### 1.7 Create New Version

```typescript
POST / estimates / { id } / version;

Response: Estimate;
```

---

## 2. COMPONENT MANAGEMENT

### 2.1 Internal Logical Files (ILF)

#### List ILFs for an estimate

```typescript
GET /estimates/{estimateId}/ilf

Response: ALI[]
```

#### Get specific ILF

```typescript
GET / estimates / { estimateId } / ilf / { id };

Response: {
  _id: string;
  name: string;
  description: string;
  recordElementTypes: number; // TR
  dataElementTypes: number; // TD
  complexity: 'LOW' | 'AVERAGE' | 'HIGH';
  functionPoints: number;
}
```

#### Create ILF

```typescript
POST /estimates/{estimateId}/ilf

Body: {
  name: string
  description: string
  recordElementTypes: number  // TR (min: 1)
  dataElementTypes: number    // TD (min: 1)
}

Response: ALI (with auto-calculated complexity and functionPoints)
```

#### Update ILF

```typescript
PUT /estimates/{estimateId}/ilf/{id}

Body: {
  name?: string
  description?: string
  recordElementTypes?: number
  dataElementTypes?: number
}

Response: ALI (with recalculated complexity and functionPoints)
```

#### Delete ILF

```typescript
DELETE / estimates / { estimateId } / ilf / { id };

Response: {
  success: boolean;
}
```

### 2.2 External Interface Files (EIF)

#### List EIFs for an estimate

```typescript
GET /estimates/{estimateId}/eif

Response: AIE[]
```

#### Get specific EIF

```typescript
GET / estimates / { estimateId } / eif / { id };

Response: {
  _id: string;
  name: string;
  description: string;
  recordElementTypes: number; // TR
  dataElementTypes: number; // TD
  complexity: 'LOW' | 'AVERAGE' | 'HIGH';
  functionPoints: number;
  externalSystem: string;
  primaryIntent: string;
}
```

#### Create EIF

```typescript
POST / estimates / { estimateId } / eif;

Body: {
  name: string;
  description: string;
  recordElementTypes: number; // TR (min: 1)
  dataElementTypes: number; // TD (min: 1)
  externalSystem: string;
  primaryIntent: string;
}

Response: AIE;
```

#### Update EIF

```typescript
PUT /estimates/{estimateId}/eif/{id}

Body: {
  name?: string
  description?: string
  recordElementTypes?: number
  dataElementTypes?: number
  externalSystem?: string
  primaryIntent?: string
}

Response: AIE
```

#### Delete EIF

```typescript
DELETE / estimates / { estimateId } / eif / { id };

Response: {
  success: boolean;
}
```

### 2.3 External Inputs (EI)

#### List EIs for an estimate

```typescript
GET /estimates/{estimateId}/ei

Response: EI[]
```

#### Get specific EI

```typescript
GET / estimates / { estimateId } / ei / { id };

Response: {
  _id: string;
  name: string;
  description: string;
  fileTypesReferenced: number; // FTR
  dataElementTypes: number; // DET
  complexity: 'LOW' | 'AVERAGE' | 'HIGH';
  functionPoints: number;
  primaryIntent: string;
  processingLogic: string;
}
```

#### Create EI

```typescript
POST / estimates / { estimateId } / ei;

Body: {
  name: string;
  description: string;
  fileTypesReferenced: number; // FTR (min: 0)
  dataElementTypes: number; // DET (min: 1)
  primaryIntent: string;
  processingLogic: string;
}

Response: EI;
```

#### Update EI

```typescript
PUT /estimates/{estimateId}/ei/{id}

Body: {
  name?: string
  description?: string
  fileTypesReferenced?: number
  dataElementTypes?: number
  primaryIntent?: string
  processingLogic?: string
}

Response: EI
```

#### Delete EI

```typescript
DELETE / estimates / { estimateId } / ei / { id };

Response: {
  success: boolean;
}
```

### 2.4 External Outputs (EO)

#### List EOs for an estimate

```typescript
GET /estimates/{estimateId}/eo

Response: EO[]
```

#### Create/Update/Delete EO

```typescript
// Same pattern as EI, but with EO-specific fields
POST / estimates / { estimateId } / eo;
PUT / estimates / { estimateId } / eo / { id };
DELETE / estimates / { estimateId } / eo / { id };
```

### 2.5 External Queries (EQ)

#### List EQs for an estimate

```typescript
GET /estimates/{estimateId}/eq

Response: EQ[]
```

#### Create/Update/Delete EQ

```typescript
// Same pattern as EI, but with EQ-specific fields
POST / estimates / { estimateId } / eq;
PUT / estimates / { estimateId } / eq / { id };
DELETE / estimates / { estimateId } / eq / { id };
```

---

## 3. CALCULATIONS

### 3.1 Recalculate Function Points

```typescript
POST / estimates / { id } / calculate;

Response: {
  id: string;
  unadjustedFunctionPoints: number;
  valueAdjustmentFactor: number;
  adjustedFunctionPoints: number;
  estimatedEffortHours: number;
  components: {
    internalLogicalFiles: number;
    externalInterfaceFiles: number;
    externalInputs: number;
    externalOutputs: number;
    externalQueries: number;
  }
}
```

### 3.2 Get Effort Estimation

```typescript
GET /estimates/{id}/effort?productivityFactor={number}

Response: {
  adjustedFunctionPoints: number
  productivityFactor: number
  estimatedEffortHours: number
  estimatedEffortDays: number
  estimatedEffortMonths: number
}
```

### 3.3 Get Team Size Recommendation

```typescript
GET /estimates/{id}/team-size?hoursPerDay={number}

Response: {
  recommendedTeamSize: number
  recommendedDurationMonths: number
  minTeamSize: number
  maxTeamSize: number
  minDurationMonths: number
  maxDurationMonths: number
}
```

---

## 4. FRONTEND IMPLEMENTATION GUIDE

### 4.1 Estimate Detail Page Structure

```typescript
interface EstimateDetailPage {
  // URL: /estimates/:id
  tabs: [
    'Overview', // Show overview data
    'ILF', // Internal Logical Files management
    'EIF', // External Interface Files management
    'EI', // External Inputs management
    'EO', // External Outputs management
    'EQ', // External Queries management
    'Settings', // Estimate properties
  ];
}
```

### 4.2 Component Management Table

```typescript
interface ComponentTable {
  columns: [
    'Name',
    'Description',
    'TR/FTR', // Record Element Types or File Types Referenced
    'TD/DET', // Data Element Types
    'Complexity', // Auto-calculated
    'Function Points', // Auto-calculated
    'Actions', // Edit/Delete buttons
  ];

  actions: {
    onEdit: (componentId: string) => void;
    onDelete: (componentId: string) => void;
    onAdd: () => void;
  };
}
```

### 4.3 Component Form

```typescript
interface ComponentForm {
  // For ILF/EIF
  fields: {
    name: string;
    description: string;
    recordElementTypes: number; // TR
    dataElementTypes: number; // TD
    externalSystem?: string; // EIF only
    primaryIntent?: string; // EIF only
  };

  // For EI/EO/EQ
  fields: {
    name: string;
    description: string;
    fileTypesReferenced: number; // FTR
    dataElementTypes: number; // DET
    primaryIntent: string;
    processingLogic: string;
  };

  validation: {
    recordElementTypes: { min: 1 };
    dataElementTypes: { min: 1 };
    fileTypesReferenced: { min: 0 };
  };
}
```

### 4.4 Auto-Calculation Flow

```typescript
// When TR/TD or FTR/DET values change:
1. Frontend validates input
2. API auto-calculates complexity & function points on save
3. Frontend updates totals
4. Optional: Call POST /estimates/{id}/calculate to update estimate totals
```

### 4.5 Error Handling

```typescript
interface APIError {
  message: string
  error: string
  statusCode: number
}

// Common error codes:
400 - Validation errors
401 - Authentication required
404 - Resource not found
500 - Server error
```

### 4.6 Real-time Updates

```typescript
// After any component CRUD operation:
1. Refetch component list
2. Refetch estimate overview
3. Update dashboard counts
4. Show success/error notifications
```

---

## 5. EXAMPLE IMPLEMENTATION

### 5.1 React Component Example

```typescript
const EstimateDetail = ({ estimateId }: { estimateId: string }) => {
  const [estimate, setEstimate] = useState(null)
  const [activeTab, setActiveTab] = useState('Overview')
  const [components, setComponents] = useState({})

  // Load estimate overview
  useEffect(() => {
    fetch(`/estimates/${estimateId}/overview`)
      .then(res => res.json())
      .then(setEstimate)
  }, [estimateId])

  // Load components for active tab
  useEffect(() => {
    if (activeTab !== 'Overview' && activeTab !== 'Settings') {
      const endpoint = getComponentEndpoint(activeTab)
      fetch(`/estimates/${estimateId}/${endpoint}`)
        .then(res => res.json())
        .then(data => setComponents(prev => ({ ...prev, [activeTab]: data })))
    }
  }, [activeTab, estimateId])

  const handleComponentSave = async (componentData) => {
    // Save component
    await saveComponent(activeTab, componentData)
    // Refresh data
    await refreshEstimate()
    await refreshComponents()
  }

  return (
    <div>
      <EstimateHeader estimate={estimate} />
      <TabNavigation tabs={TABS} active={activeTab} onChange={setActiveTab} />

      {activeTab === 'Overview' && <OverviewTab estimate={estimate} />}
      {activeTab !== 'Overview' && activeTab !== 'Settings' && (
        <ComponentTab
          type={activeTab}
          components={components[activeTab] || []}
          onSave={handleComponentSave}
          onDelete={handleComponentDelete}
        />
      )}
      {activeTab === 'Settings' && <SettingsTab estimate={estimate} />}
    </div>
  )
}
```

### 5.2 Component CRUD Operations

```typescript
const ComponentAPI = {
  // Get all components of a type
  list: (estimateId: string, type: string) =>
    fetch(`/estimates/${estimateId}/${type.toLowerCase()}`),

  // Create component
  create: (estimateId: string, type: string, data: any) =>
    fetch(`/estimates/${estimateId}/${type.toLowerCase()}`, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' },
    }),

  // Update component
  update: (estimateId: string, type: string, id: string, data: any) =>
    fetch(`/estimates/${estimateId}/${type.toLowerCase()}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' },
    }),

  // Delete component
  delete: (estimateId: string, type: string, id: string) =>
    fetch(`/estimates/${estimateId}/${type.toLowerCase()}/${id}`, {
      method: 'DELETE',
    }),
};
```

---

## 6. VALIDATION RULES

### 6.1 Input Validation

```typescript
const ValidationRules = {
  ILF: {
    recordElementTypes: { min: 1, type: 'integer' },
    dataElementTypes: { min: 1, type: 'integer' },
  },
  EIF: {
    recordElementTypes: { min: 1, type: 'integer' },
    dataElementTypes: { min: 1, type: 'integer' },
  },
  EI: {
    fileTypesReferenced: { min: 0, type: 'integer' },
    dataElementTypes: { min: 1, type: 'integer' },
  },
  EO: {
    fileTypesReferenced: { min: 0, type: 'integer' },
    dataElementTypes: { min: 1, type: 'integer' },
  },
  EQ: {
    fileTypesReferenced: { min: 0, type: 'integer' },
    dataElementTypes: { min: 1, type: 'integer' },
  },
};
```

### 6.2 Complexity Calculation Rules

The system automatically calculates complexity based on FPA standards:

**Data Functions (ILF/EIF):**

- Based on Record Element Types (TR) and Data Element Types (TD)
- Matrix: TR × TD → Complexity Level → Function Points

**Transaction Functions (EI/EO/EQ):**

- Based on File Types Referenced (FTR) and Data Element Types (DET)
- Matrix: FTR × DET → Complexity Level → Function Points

---

## 7. BEST PRACTICES

### 7.1 State Management

- Keep estimate overview in global state
- Cache component lists per tab
- Invalidate cache after mutations

### 7.2 User Experience

- Show loading states during API calls
- Validate inputs before submission
- Confirm before delete operations
- Auto-save drafts periodically

### 7.3 Performance

- Lazy load component data per tab
- Debounce search/filter inputs
- Paginate large component lists
- Use optimistic updates for better UX

### 7.4 Error Handling

- Show specific validation errors
- Retry failed requests
- Graceful fallbacks for missing data
- Clear error messages

---

This guide provides everything needed to build a comprehensive FPA estimation frontend that integrates seamlessly with the backend API.
