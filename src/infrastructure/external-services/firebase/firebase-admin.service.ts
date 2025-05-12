import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseAdminService implements OnModuleInit {
  private firebaseApp: admin.app.App;
  private readonly logger = new Logger(FirebaseAdminService.name);

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    if (!admin.apps.length) {
      const projectId = this.configService.get<string>(
        'app.firebase.projectId',
      );
      const clientEmail = this.configService.get<string>(
        'app.firebase.clientEmail',
      );
      const privateKey = this.configService.get<string>(
        'app.firebase.privateKey',
      );

      if (!projectId || !clientEmail || !privateKey) {
        this.logger.warn(
          'Firebase credentials are missing. Firebase authentication will not work.',
        );
        return;
      }

      try {
        this.firebaseApp = admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            clientEmail,
            privateKey: privateKey.replace(/\\n/g, '\n'),
          }),
        });
        this.logger.log('Firebase Admin initialized successfully');
      } catch (error) {
        this.logger.error('Failed to initialize Firebase Admin:', error);
      }
    } else {
      this.firebaseApp = admin.apps[0]!;
    }
  }

  async verifyIdToken(idToken: string): Promise<admin.auth.DecodedIdToken> {
    if (!this.firebaseApp) {
      throw new Error('Firebase Admin SDK not initialized');
    }

    try {
      return await this.firebaseApp.auth().verifyIdToken(idToken);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error verifying Firebase token: ${errorMessage}`);
      throw new Error('Invalid Firebase ID token');
    }
  }
}
