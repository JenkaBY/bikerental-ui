import { GeneratorConfig } from 'ng-openapi';

const config: GeneratorConfig = {
  input: 'http://localhost:8080/v3/api-docs/all',
  output: '../src/core/api/generated',
  options: {
    dateType: 'Date',
    enumStyle: 'enum',
    generateServices: true,
    responseTypeMapping: {
      'application/json': 'json',
    },
  },
};

export default config;
