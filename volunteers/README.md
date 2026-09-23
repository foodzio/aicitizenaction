# volunteers/

One **optional** file per steward, named `<github-handle>.yml`. It holds only what the project needs. Real names are never required, and no location is ever inferred or published from the paths someone holds.

```yaml
handle: example-handle
roles: [geography]
paths: [content/bodies/ie/]
languages: [en, ga]
conflicts:
  - record: global-access-now
    nature: I volunteer for this organisation
credit: true        # list me on the public contributors page
since: 2026-10-01
status: active
```

`npm run validate` checks every file here: paths must exist and conflict records must be real ids. Someone with a conflict does not review that record.
