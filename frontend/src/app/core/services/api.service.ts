import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Department,
  Budget,
  Expenditure,
  Alert,
  AuditLog,
  SystemConfiguration,
  DashboardSummary,
  User,
} from '../models';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private baseUrl = 'http://localhost:5000/api';

  constructor(private http: HttpClient) {}

  // --- DASHBOARD ---
  public getDashboardSummary(financialYear?: string, departmentId?: string): Observable<any> {
    let params = new HttpParams();
    if (financialYear) params = params.set('financialYear', financialYear);
    if (departmentId) params = params.set('departmentId', departmentId);
    return this.http.get<any>(`${this.baseUrl}/dashboard/summary`, { params });
  }

  public getDashboardTrends(financialYear?: string, departmentId?: string): Observable<any> {
    let params = new HttpParams();
    if (financialYear) params = params.set('financialYear', financialYear);
    if (departmentId) params = params.set('departmentId', departmentId);
    return this.http.get<any>(`${this.baseUrl}/dashboard/trends`, { params });
  }

  public getDashboardDepartments(financialYear?: string): Observable<any> {
    let params = new HttpParams();
    if (financialYear) params = params.set('financialYear', financialYear);
    return this.http.get<any>(`${this.baseUrl}/dashboard/departments`, { params });
  }

  public getDashboardCategories(financialYear?: string, departmentId?: string): Observable<any> {
    let params = new HttpParams();
    if (financialYear) params = params.set('financialYear', financialYear);
    if (departmentId) params = params.set('departmentId', departmentId);
    return this.http.get<any>(`${this.baseUrl}/dashboard/categories`, { params });
  }

  public getDashboardAlertsDistribution(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/dashboard/alerts-distribution`);
  }

  // --- DEPARTMENTS ---
  public getDepartments(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/departments`);
  }

  public getDepartmentById(id: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/departments/${id}`);
  }

  public createDepartment(dept: Partial<Department>): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/departments`, dept);
  }

  public updateDepartment(id: string, dept: Partial<Department>): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/departments/${id}`, dept);
  }

  public deleteDepartment(id: string): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/departments/${id}`);
  }

  // --- BUDGETS ---
  public getBudgets(filters: any = {}): Observable<any> {
    let params = new HttpParams();
    Object.keys(filters).forEach((key) => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
        params = params.set(key, filters[key]);
      }
    });
    return this.http.get<any>(`${this.baseUrl}/budgets`, { params });
  }

  public getBudgetById(id: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/budgets/${id}`);
  }

  public createBudget(budget: Partial<Budget>): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/budgets`, budget);
  }

  public updateBudget(id: string, budget: Partial<Budget>): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/budgets/${id}`, budget);
  }

  public deleteBudget(id: string): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/budgets/${id}`);
  }

  // --- EXPENDITURES ---
  public getExpenditures(filters: any = {}): Observable<any> {
    let params = new HttpParams();
    Object.keys(filters).forEach((key) => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
        params = params.set(key, filters[key]);
      }
    });
    return this.http.get<any>(`${this.baseUrl}/expenditures`, { params });
  }

  public createExpenditure(formData: FormData): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/expenditures`, formData);
  }

  public updateExpenditure(id: string, formData: FormData): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/expenditures/${id}`, formData);
  }

  public deleteExpenditure(id: string): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/expenditures/${id}`);
  }

  public downloadExpenditureDocumentUrl(id: string): string {
    return `${this.baseUrl}/expenditures/${id}/document`;
  }

  // --- ALERTS ---
  public getAlerts(filters: any = {}): Observable<any> {
    let params = new HttpParams();
    Object.keys(filters).forEach((key) => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
        params = params.set(key, filters[key]);
      }
    });
    return this.http.get<any>(`${this.baseUrl}/alerts`, { params });
  }

  public acknowledgeAlert(id: string): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/alerts/${id}/acknowledge`, {});
  }

  public resolveAlert(id: string, resolutionNotes: string): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/alerts/${id}/resolve`, { resolutionNotes });
  }

  public triggerAnomalyScan(): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/alerts/scan`, {});
  }

  // --- USERS (ADMIN) ---
  public getUsers(filters: any = {}): Observable<any> {
    let params = new HttpParams();
    Object.keys(filters).forEach((key) => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
        params = params.set(key, filters[key]);
      }
    });
    return this.http.get<any>(`${this.baseUrl}/users`, { params });
  }

  public createUser(user: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/users`, user);
  }

  public updateUser(id: string, user: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/users/${id}`, user);
  }

  public deleteUser(id: string): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/users/${id}`);
  }

  // --- REPORTS ---
  public getBudgetReport(filters: any = {}): Observable<any> {
    let params = new HttpParams();
    Object.keys(filters).forEach((key) => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
        params = params.set(key, filters[key]);
      }
    });
    return this.http.get<any>(`${this.baseUrl}/reports/budget`, { params });
  }

  public downloadReport(reportType: 'budget' | 'expenditure' | 'anomalies', format: 'csv' | 'pdf', filters: any = {}): Observable<Blob> {
    let params = new HttpParams().set('format', format);
    Object.keys(filters).forEach((key) => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
        params = params.set(key, filters[key]);
      }
    });
    return this.http.get(`${this.baseUrl}/reports/${reportType}`, {
      params,
      responseType: 'blob',
    });
  }

  // --- AUDIT LOGS ---
  public getAuditLogs(filters: any = {}): Observable<any> {
    let params = new HttpParams();
    Object.keys(filters).forEach((key) => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
        params = params.set(key, filters[key]);
      }
    });
    return this.http.get<any>(`${this.baseUrl}/audit-logs`, { params });
  }

  // --- CONFIG ---
  public getConfig(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/config`);
  }

  public updateConfig(config: Partial<SystemConfiguration>): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/config`, config);
  }
}
