import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

export interface DirectoriesResponse {
	directories: string[];
}

@Injectable({ providedIn: 'root' })
export class DirectoriesService {
	private readonly baseUrl = (() => {
		const base = environment.apiBaseUrl ?? '';
		if (base) return `${base}/api/directories`;
		const isBrowser = typeof window !== 'undefined' && !!window.location;
		return (isBrowser ? window.location.origin : 'http://localhost:3000') + '/api/directories';
	})();

	constructor(private http: HttpClient) {}

	list(): Observable<DirectoriesResponse> {
		return this.http.get<DirectoriesResponse>(this.baseUrl);
	}

	add(path: string): Observable<DirectoriesResponse> {
		return this.http.post<DirectoriesResponse>(this.baseUrl, { path });
	}

	remove(path: string): Observable<DirectoriesResponse> {
		return this.http.request<DirectoriesResponse>('DELETE', this.baseUrl, { body: { path } });
	}
}


