import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, tap } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { AuthService } from '../auth/auth.service';
import { Client } from '../../domain/models/client.model';

const BASE = '/api/clients';

/**
 * Service centralisé pour le portail client.
 * Résout l'ID du client lié à l'utilisateur connecté
 * et l'expose à tous les composants du portail.
 */
@Injectable({ providedIn: 'root' })
export class ClientPortalService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  /** Signal contenant le clientId résolu (null = pas encore chargé) */
  readonly clientId = signal<number | null>(null);

  /**
   * Résout et met en cache le clientId de l'utilisateur connecté.
   * Cherche le client dont le userId correspond à l'utilisateur connecté.
   */
  resolveClientId(): Observable<number | null> {
    // Si déjà résolu, retourner directement
    const cached = this.clientId();
    if (cached !== null) {
      return of(cached);
    }

    const userId = this.authService.currentUser()?.id;
    if (!userId) {
      return of(null);
    }

    const params = new HttpParams().set('userId', userId.toString());
    return this.http.get<Client[]>(BASE, { params }).pipe(
      tap(clients => {
        // Le client lié à cet utilisateur
        const myClient = clients.find(c => c.userId === userId);
        if (myClient?.idClient) {
          this.clientId.set(myClient.idClient);
        }
      }),
      switchMap(clients => {
        const myClient = clients.find(c => c.userId === userId);
        return of(myClient?.idClient ?? null);
      })
    );
  }

  /** Réinitialise le cache (utile à la déconnexion) */
  reset(): void {
    this.clientId.set(null);
  }
}
