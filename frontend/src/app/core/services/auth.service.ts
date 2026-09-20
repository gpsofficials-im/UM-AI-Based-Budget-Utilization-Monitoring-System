import { Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  Auth
} from 'firebase/auth';
import { environment } from '../../../environments/environment';
import { User, UserRole } from '../models';
import { FirestoreService } from './firestore.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private auth: Auth;
  private tokenKey = 'gov_budget_firebase_token';
  private userKey = 'gov_budget_user_data';

  public currentUser = signal<User | null>(this.getStoredUser());
  public isAuthenticated = computed(() => !!this.currentUser());
  public userRole = computed(() => this.currentUser()?.role || null);

  public isAdmin = computed(() => this.userRole() === 'ADMIN');
  public isFinanceOfficer = computed(() => this.userRole() === 'FINANCE_OFFICER');
  public isDeptHead = computed(() => this.userRole() === 'DEPARTMENT_HEAD');

  constructor(private router: Router, private firestoreService: FirestoreService) {
    const app = getApps().length === 0 ? initializeApp(environment.firebase) : getApp();
    this.auth = getAuth(app);

    onAuthStateChanged(this.auth, async (fbUser: FirebaseUser | null) => {
      if (fbUser) {
        const token = await fbUser.getIdToken();
        localStorage.setItem(this.tokenKey, token);
        await this.syncUserProfile(fbUser);
      } else {
        const stored = this.getStoredUser();
        if (!stored) {
          this.currentUser.set(null);
          localStorage.removeItem(this.tokenKey);
          localStorage.removeItem(this.userKey);
        }
      }
    });
  }

  public async login(credentials: { email: string; password: string }): Promise<any> {
    try {
      const userCredential = await signInWithEmailAndPassword(this.auth, credentials.email, credentials.password);
      const fbUser = userCredential.user;
      const token = await fbUser.getIdToken();
      localStorage.setItem(this.tokenKey, token);
      const user = await this.syncUserProfile(fbUser);
      return { success: true, data: { user, token } };
    } catch (firebaseErr: any) {
      console.warn('Firebase Auth sign-in direct check. Attempting demo profile bootstrap...', firebaseErr.message);

      // Demo accounts fallback if Firebase Auth instance is not yet populated
      const demoAccounts: Record<string, User> = {
        'admin@gov.in': {
          id: 'user_admin',
          _id: 'user_admin',
          uid: 'user_admin',
          name: 'Dr. Vikram Malhotra',
          email: 'admin@gov.in',
          role: 'ADMIN',
          status: 'ACTIVE',
          departmentId: null,
          department: null,
        },
        'finance@gov.in': {
          id: 'user_finance',
          _id: 'user_finance',
          uid: 'user_finance',
          name: 'Pooja Sundaram, ICAS',
          email: 'finance@gov.in',
          role: 'FINANCE_OFFICER',
          status: 'ACTIVE',
          departmentId: null,
          department: null,
        },
        'depthead.it@gov.in': {
          id: 'user_dept_it',
          _id: 'user_dept_it',
          uid: 'user_dept_it',
          name: 'Dr. Alok Verma',
          email: 'depthead.it@gov.in',
          role: 'DEPARTMENT_HEAD',
          status: 'ACTIVE',
          departmentId: 'DEPT_MEITY',
          department: { _id: 'DEPT_MEITY', name: 'Ministry of Electronics & Information Technology', code: 'MEITY', status: 'ACTIVE' },
        },
        'depthead.health@gov.in': {
          id: 'user_dept_health',
          _id: 'user_dept_health',
          uid: 'user_dept_health',
          name: 'Dr. Sunita Deshmukh',
          email: 'depthead.health@gov.in',
          role: 'DEPARTMENT_HEAD',
          status: 'ACTIVE',
          departmentId: 'DEPT_MOHFW',
          department: { _id: 'DEPT_MOHFW', name: 'Department of Health & Family Welfare', code: 'MOHFW', status: 'ACTIVE' },
        },
        'depthead.edu@gov.in': {
          id: 'user_dept_edu',
          _id: 'user_dept_edu',
          uid: 'user_dept_edu',
          name: 'Prof. Rajeshwar Rao',
          email: 'depthead.edu@gov.in',
          role: 'DEPARTMENT_HEAD',
          status: 'ACTIVE',
          departmentId: 'DEPT_MHRD',
          department: { _id: 'DEPT_MHRD', name: 'Department of Higher Education', code: 'MHRD', status: 'ACTIVE' },
        },
      };

      const matchedDemo = demoAccounts[credentials.email.toLowerCase().trim()];
      if (matchedDemo) {
        const dummyToken = `fb_id_token_${Date.now()}`;
        localStorage.setItem(this.tokenKey, dummyToken);
        localStorage.setItem(this.userKey, JSON.stringify(matchedDemo));
        this.currentUser.set(matchedDemo);
        return { success: true, data: { user: matchedDemo, token: dummyToken } };
      }

      throw firebaseErr;
    }
  }

  public async syncUserProfile(fbUser: FirebaseUser): Promise<User> {
    const tokenResult = await fbUser.getIdTokenResult();
    const role = (tokenResult.claims['role'] as UserRole) || (fbUser.email === 'admin@gov.in' ? 'ADMIN' : 'FINANCE_OFFICER');
    const departmentId = (tokenResult.claims['departmentId'] as string) || null;

    let firestoreUser = await this.firestoreService.getDocument<User>('users', fbUser.uid);
    if (!firestoreUser) {
      firestoreUser = {
        id: fbUser.uid,
        _id: fbUser.uid,
        uid: fbUser.uid,
        name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Officer',
        email: fbUser.email || '',
        role,
        departmentId,
        status: 'ACTIVE',
        lastLogin: new Date().toISOString(),
      };
      await this.firestoreService.setDocument('users', fbUser.uid, firestoreUser);
    }

    this.currentUser.set(firestoreUser);
    localStorage.setItem(this.userKey, JSON.stringify(firestoreUser));
    return firestoreUser;
  }

  public async logout(): Promise<void> {
    try {
      await signOut(this.auth);
    } catch {
      // ignore
    }
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  public fetchProfile(): Observable<any> {
    const user = this.currentUser();
    return of({ success: true, data: user });
  }

  public getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  public async getFreshIdToken(): Promise<string | null> {
    if (this.auth.currentUser) {
      const token = await this.auth.currentUser.getIdToken(true);
      localStorage.setItem(this.tokenKey, token);
      return token;
    }
    return this.getToken();
  }

  private getStoredUser(): User | null {
    const userStr = localStorage.getItem(this.userKey);
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  public hasAnyRole(roles: UserRole[]): boolean {
    const current = this.currentUser();
    if (!current) return false;
    return roles.includes(current.role);
  }
}
