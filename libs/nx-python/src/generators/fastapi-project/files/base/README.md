# FastAPI application <%= projectName %>

## 🚀 How to run locally

### Development server
Install dependencies:
```bash
pnpx nx run <%= projectName %>:install
```

Activate virtual environment created at `<%= projectName %>/.venv` and run the FastAPI server:
```bash
pnpx nx run <%= projectName %>:dev
```

### CLI
Install dependencies:
```bash
pnpx nx run <%= projectName %>:install
```

Activate virtual environment created at `<%= projectName %>/.venv` and run the FastAPI server:
```bash
uvicorn <%= projectName %>.main:app --host="0.0.0.0" --port="<%= port %>"
```


### Docker
When building the docker container, make sure to pass the root of the monorepo as the build context:
```bash
docker build -t <%= projectName %>:latest -f ./services/<%= projectName %>/Dockerfile .
```


## ⚡️ Next steps

- [ ] Write some code
- [ ] Add tests
- [ ] Update this documentation
