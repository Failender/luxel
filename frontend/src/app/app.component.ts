import {ChangeDetectionStrategy, Component} from '@angular/core';
import {MsalService} from '@azure/msal-angular';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent {

  constructor(private authService: MsalService) {


  }

  public getName(): string {
    return this.authService.getAccount()?.userName;
  }

  public isLoggedIn(): boolean {
    return !!this.authService.getAccount();
  }

  public logout() {
    this.authService.logout();
  }

}
