import {ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit} from '@angular/core';
import {isIE} from '../msal.config';
import {BroadcastService, MsalService} from '@azure/msal-angular';
import {Router} from '@angular/router';
import {Subject, Subscription} from 'rxjs';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginComponent implements OnInit, OnDestroy {


  private takeUntil = new Subject();
  private subs: Subscription[] = [];

  constructor(
    private authService: MsalService,
    private router: Router,
    private broadcastService: BroadcastService,
    private cdr: ChangeDetectorRef
  ) {
  }

  public ngOnInit(): void {
    if (!!this.authService.getAccount()) {
      // this.router.navigateByUrl('/calendar');
    }

    this.subs.push(this.broadcastService.subscribe('msal:loginSuccess', () => {
      this.router.navigateByUrl('/calendar');
    }));
    var tokenRequest = {
      scopes: ['user.read', 'mail.read', 'Calendars.ReadWrite']
    };
    // this.authService.acquireTokenPopup(tokenRequest).then();


  }

  public login(): void {
    if (isIE) {
      this.authService.loginRedirect();
    } else {
      this.authService.loginPopup();
    }
  }

  ngOnDestroy(): void {
    this.takeUntil.next();
    this.subs.forEach(sub => sub.unsubscribe());
  }

}
