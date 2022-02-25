import {Injectable} from "@angular/core";
import {HttpClient, HttpErrorResponse} from "@angular/common/http";
import {FbAuthResponse, User} from "../../../shared/interfaces";
import {catchError, Observable, throwError, Subject, tap,} from "rxjs";
import {environment} from "../../../../environments/environment";
import {FB_TOKEN, FB_TOKEN_EXP} from "../constants/auth.constants";

@Injectable({providedIn: 'root'})

export class AuthService {

  public error$: Subject<string> = new Subject<string>()

  constructor(private http: HttpClient) {}

  get token(): string {
    const dateFromStorage = localStorage.getItem(FB_TOKEN_EXP)
    if (!dateFromStorage) {
      return ''
    }
    const expDate = new Date(dateFromStorage)
    if(new Date() > expDate) {
      this.logout()
      return ''
    }
    return localStorage.getItem(FB_TOKEN) || ''
  }

  login(user: User): Observable<any> {
    user.returnSecureToken = true
    return this.http.post(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${environment.apiKey}`,user)
        .pipe(
          tap((res) => this.setToken(res as FbAuthResponse)),
          catchError(this.handleError.bind(this))
        )
  }

  logout() {
    this.setToken(null)
  }

  get isAuthenticated(): boolean {
    return !!this.token
  }

  private handleError(error: HttpErrorResponse) {
      const {message} = error.error.error

    switch (message) {
      case 'INVALID_EMAIL' :
        this.error$.next('Неверный пароль')
        break
      case 'INVALID_PASSWORD' :
        this.error$.next('Неверный пароль')
        break
      case 'INVALID_NOT_FOUND' :
        this.error$.next('Такого email нет')
        break
    }
    return throwError(error)
  }

  private setToken(response: FbAuthResponse | null) {
    if(response){
      const expDate = new Date(new Date().getTime() + +response.expiresIn * 1000)
      localStorage.setItem(FB_TOKEN, response.idToken)
      localStorage.setItem(FB_TOKEN_EXP, expDate.toString())
    } else {
      localStorage.clear()
    }
  }
}
