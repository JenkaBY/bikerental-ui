/// <reference types="@angular/localize" />

import { bootstrapApplication } from '@angular/platform-browser';
import { adoptTenantBase } from '@bikerental/shared';
import { appConfig } from './app/app.config';
import { App } from './app/app';

if (adoptTenantBase('admin')) {
  bootstrapApplication(App, appConfig).catch((err) => console.error(err));
}
