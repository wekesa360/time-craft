import { Hono } from 'hono';
import openApiSpec from '../../complete-openapi-all-endpoints.json';

const openapi = new Hono();

// OpenAPI specification endpoint
openapi.get('/', async (c) => {
  return c.json(openApiSpec);
});

// OpenAPI specification in YAML format
openapi.get('/yaml', async (c) => {
  const yaml = require('js-yaml');
  const yamlSpec = yaml.dump(openApiSpec);
  
  return new Response(yamlSpec, {
    headers: {
      'Content-Type': 'text/yaml'
    }
  });
});

// OpenAPI specification in JSON format (same as root)
openapi.get('/json', async (c) => {
  return c.json(openApiSpec);
});

export default openapi;
