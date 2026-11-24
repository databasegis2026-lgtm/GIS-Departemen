/**
 * @file server.js
 * @description Entry point server Express Backend.
 */

const app = require("./app");

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(` GIS Backend Service (Mock-First Architecture) `);
  console.log(` Server berjalan pada port: ${PORT} `);
  console.log(` Endpoint: http://localhost:${PORT}/api/v1/operasional `);
  console.log(` Spatial:  http://localhost:${PORT}/api/v1/spatial `);
  console.log(`=================================================`);
});
