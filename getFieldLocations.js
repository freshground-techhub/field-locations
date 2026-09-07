/**
 * @NApiVersion 2.1
 * @NScriptType Restlet
 *
 * getFieldLocations.js
 *
 * Deployed as a RESTlet (Script ID customscript2609, Deployment customdeploy1).
 * Reads the current lat/lon straight off the Employee record's own fields
 * rather than the saved search, since Latitude/Longitude are live custom
 * fields on Employee (not a separate log table) - the saved search's
 * "Field/New Value/Old Value" columns are just System Notes audit history
 * for those same two fields, which we don't need to parse.
 *
 * Field IDs used (confirmed from Customization > Entity Fields):
 *   custentity_nx_latitude
 *   custentity_nx_longitude
 *
 * Timestamp uses the Employee record's own Last Modified date as a proxy
 * for "last GPS ping" - confirm this doesn't drift if the record gets
 * edited for unrelated reasons (HR changes etc); if it does, this should
 * be swapped for a proper System Notes join filtered to just those two
 * fields.
 *
 * DEPLOYMENT (already done):
 * 1. File uploaded to File Cabinet, Script record created (customscript2609)
 * 2. Deployment created (customdeploy1), Status = Released
 * 3. Audience > Internal roles = FG Management (must match the role used
 *    for the Access Token in NetSuite's Token-Based Authentication setup)
 * 4. External URL:
 *    https://8215914.restlets.api.netsuite.com/app/site/hosting/restlet.nl?script=2609&deploy=1
 */

define(['N/search'], function (search) {

  // Converts NetSuite's UK-format "DD/MM/YYYY HH:mm" into a proper ISO
  // string, so the browser never has to guess date order (which caused
  // wrong/invalid dates when the raw string was passed straight through).
  function toIso(nsDateString) {
    if (!nsDateString) return null;
    var parts = nsDateString.split(' ');
    var datePart = parts[0];
    var timePart = parts[1] || '00:00';
    var dmy = datePart.split('/');
    if (dmy.length !== 3) return null;
    var day = dmy[0].padStart(2, '0');
    var month = dmy[1].padStart(2, '0');
    var year = dmy[2];
    var hm = timePart.split(':');
    var hour = (hm[0] || '00').padStart(2, '0');
    var min = (hm[1] || '00').padStart(2, '0');
    return year + '-' + month + '-' + day + 'T' + hour + ':' + min + ':00';
  }

  function doGet() {
    var results = [];

    // Load the actual saved search rather than building a raw Employee
    // query - this inherits whatever scoping already narrows it down to
    // real field engineers, rather than guessing at department/type
    // fields ourselves.
    var savedSearch = search.load({ id: 'customsearch_nxc_employee_geo_location_2' });

    // Add an explicit inactive-employee filter as a safety net, in case
    // the saved search's own filters ever change.
    savedSearch.filters.push(
      search.createFilter({ name: 'isinactive', operator: search.Operator.IS, values: false })
    );

    var pageData = savedSearch.runPaged({ pageSize: 1000 });

    pageData.pageRanges.forEach(function (pageRange) {
      var page = pageData.fetch({ index: pageRange.index });
      page.data.forEach(function (result) {
        // Columns are read positionally in the order defined on the saved
        // search: Name, Most Recent Latitude, Most Recent Longitude, Date.
        var cols = result.columns;
        var name = result.getValue(cols[0]);
        var lat = result.getValue(cols[1]);
        var lon = result.getValue(cols[2]);
        var rawDate = result.getValue(cols[3]);

        results.push({
          name: name,
          lat: lat,
          lon: lon,
          date: toIso(rawDate)
        });
      });
    });

    // The search returns every ping for the day, not just the latest -
    // collapse down to the most recent entry per person.
    var latest = {};
    results.forEach(function (row) {
      if (!row.date) return; // skip anything with an unparseable date
      var existing = latest[row.name];
      if (!existing || new Date(row.date) > new Date(existing.date)) {
        latest[row.name] = row;
      }
    });

    return JSON.stringify({
      generatedAt: new Date().toISOString(),
      engineers: Object.keys(latest).map(function (name) {
        return latest[name];
      })
    });
  }

  return { get: doGet };
});
