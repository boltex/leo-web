# Todo

# Add analytics to track total visitors and traffic

```html
<!-- Google tag (gtag.js) -->
<script
  async
  src="https://www.googletagmanager.com/gtag/js?id=G-GQNGXDL56Y"
></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag() {
    dataLayer.push(arguments);
  }
  gtag("js", new Date());

  gtag("config", "G-GQNGXDL56Y");
</script>
```

Maybe only insert this at webpack/ts compile time if the environement contains the ID? (use placeholder instead of ID shown in code above) See .github/workflows/deploy.yml file for deployment setup.
