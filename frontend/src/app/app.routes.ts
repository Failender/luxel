import {Routes} from '@angular/router';
import {LoginComponent} from './login/login.component';
import {ProfileComponent} from './profile/profile.component';
import {MsalGuard} from '@azure/msal-angular';
import {CalendarComponent} from './calendar/calendar.component';
import {ParseComponent} from './parse/parse.component';

export const routes: Routes = [

  {path: 'login', component: LoginComponent},
  {
    path: 'profile', component: ProfileComponent, canActivate: [
      MsalGuard
    ]
  },
  {
    path: 'calendar', component: CalendarComponent, canActivate: [
      MsalGuard
    ]
  },

  {
    path: 'parse', component: ParseComponent, canActivate: [
      MsalGuard
    ]
  },


  {path: '', redirectTo: '/login', pathMatch: 'full'},

];
