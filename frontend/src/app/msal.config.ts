import {Configuration} from 'msal';
import {MsalAngularConfiguration} from '@azure/msal-angular';
import {environment} from '../environments/environment';

export const protectedResourceMap: [string, string[]][] = [
  ['https://graph.microsoft.com/v1.0/me', ['user.read']],
  ['https://outlook.office.com/api/v1.0/me', ['user.read']],

];

export const isIE = window.navigator.userAgent.indexOf('MSIE ') > -1 || window.navigator.userAgent.indexOf('Trident/') > -1;

export function MSALConfigFactory(): Configuration {
  console.debug('URI', environment.redirectUri);
  return {
    auth: {
      clientId: 'd9191eda-120a-4a15-b9f3-da457e683e38',
      validateAuthority: true,
      redirectUri: environment.redirectUri,
      postLogoutRedirectUri: environment.redirectUri,
      navigateToLoginRequestUrl: true,
    },
    cache: {
      cacheLocation: 'localStorage',
      storeAuthStateInCookie: isIE, // set to true for IE 11
    },
  };
}

export function MSALAngularConfigFactory(): MsalAngularConfiguration {
  return {
    popUp: !isIE,
    consentScopes: [
      'user.read',
      'openid',
      'profile',
    ],
    unprotectedResources: ['https://www.microsoft.com/en-us/'],
    protectedResourceMap,
    extraQueryParameters: {}
  };
}
