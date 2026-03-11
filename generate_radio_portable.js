const { register } = require('ts-node');
register({ transpileOnly: true });

const { generateRadiographyPortableTemplate } = require('./src/components/Admin/Orders/ServiceReportGeneration.tsx/TestTables/RadiographyPortable/generateTemplate.ts');

generateRadiographyPortableTemplate();
