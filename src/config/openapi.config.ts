import { GeneratorConfig } from 'ng-openapi';

const config: GeneratorConfig = {
  input: 'http://localhost:8080/v3/api-docs/all',
  output: '../app/core/api/generated',
  options: {
    dateType: 'Date',
    enumStyle: 'enum',
    generateServices: true,
  },
};

export default config;
