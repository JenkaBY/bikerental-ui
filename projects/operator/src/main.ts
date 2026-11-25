import { bootstrapApplication } from '@angular/platform-browser';
import { adoptTenantBase } from '@bikerental/shared';
import { appConfig } from './app/app.config';
import { App } from './app/app';

if (adoptTenantBase('operator')) {
  bootstrapApplication(App, appConfig).catch((err) => console.error(err));
}
