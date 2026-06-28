# API request examples

These examples use PowerShell and assume the server is running on port 4000.

## Super Admin login and organization creation

```powershell
$superLogin = Invoke-RestMethod `
  -Method Post `
  -Uri http://localhost:4000/api/super-admin/login `
  -ContentType application/json `
  -Body '{"email":"superadmin@example.com","password":"SuperAdmin123!"}'

$superHeaders = @{ Authorization = "Bearer $($superLogin.token)" }

Invoke-RestMethod `
  -Method Post `
  -Uri http://localhost:4000/api/super-admin/organizations `
  -Headers $superHeaders `
  -ContentType application/json `
  -Body '{"name":"Acme","slug":"acme","adminSignupCode":"acme-secret"}'
```

## Organization Admin signup and flag creation

```powershell
$adminSignup = Invoke-RestMethod `
  -Method Post `
  -Uri http://localhost:4000/api/auth/signup `
  -ContentType application/json `
  -Body '{"name":"Acme Admin","email":"admin@acme.test","password":"Password123!","organizationSlug":"acme","adminSignupCode":"acme-secret","role":"organization_admin"}'

$adminHeaders = @{ Authorization = "Bearer $($adminSignup.token)" }

Invoke-RestMethod `
  -Method Post `
  -Uri http://localhost:4000/api/flags `
  -Headers $adminHeaders `
  -ContentType application/json `
  -Body '{"key":"new_dashboard","description":"New dashboard rollout","enabled":true}'
```

## End User signup and feature check

```powershell
$userSignup = Invoke-RestMethod `
  -Method Post `
  -Uri http://localhost:4000/api/auth/signup `
  -ContentType application/json `
  -Body '{"name":"Acme User","email":"user@acme.test","password":"Password123!","organizationSlug":"acme","role":"end_user"}'

$userHeaders = @{ Authorization = "Bearer $($userSignup.token)" }

Invoke-RestMethod `
  -Method Post `
  -Uri http://localhost:4000/api/flags/check `
  -Headers $userHeaders `
  -ContentType application/json `
  -Body '{"key":"new_dashboard"}'
```
