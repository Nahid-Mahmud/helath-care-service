

## Prisma Structure

```
prisma/
├── schema/
│   ├── enum.prisma
│   ├── schema.prisma
│   └── user.prisma
└── migrations/
    ├── migration_lock.toml
    ├── 20251001132651_init_users/
    │   └── migration.sql
    └── 20251019055538_address_optional_on_patient_model/
        └── migration.sql
```
### Add script in the package.json

```javascript
"prisma": {
    "schema": "./prisma/schema"
  },
```