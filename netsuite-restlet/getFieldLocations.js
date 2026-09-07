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

  function doGet() {
    var results = [];

    var employeeSearch = search.create({
      type: search.Type.EMPLOYEE,
      filters: [
        ['isinactive', 'is', 'F'],
        'AND',
        ['custentity_nx_latitude', 'isnotempty', '']
      ],
      columns: [
        search.createColumn({ name: 'entityid' }),
        search.createColumn({ name: 'custentity_nx_latitude' }),
        search.createColumn({ name: 'custentity_nx_longitude' }),
        search.createColumn({ name: 'lastmodifieddate' })
      ]
    });

    var pageData = employeeSearch.runPaged({ pageSize: 1000 });

    pageData.pageRanges.forEach(function (pageRange) {
      var page = pageData.fetch({ index: pageRange.index });
      page.data.forEach(function (result) {
        results.push({
          name: result.getValue({ name: 'entityid' }),
          lat: result.getValue({ name: 'custentity_nx_latitude' }),
          lon: result.getValue({ name: 'custentity_nx_longitude' }),
          date: result.getValue({ name: 'lastmodifieddate' })
        });
      });
    });

    return JSON.stringify({
      generatedAt: new Date().toISOString(),
      engineers: results
    });
  }

  return { get: doGet };
});
