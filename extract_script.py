import re
import sys

radiography_file = r"c:/PROJECTS/anteso/anteso-frontend/src/components/Admin/Orders/ServiceReportGeneration.tsx/TestTables/RadiographyFixed/ViewServiceReport.tsx"
ir_file = r"c:/PROJECTS/anteso/anteso-frontend/src/components/Admin/Orders/ServiceReportGeneration.tsx/TestTables/Inventional-Radiology/ViewServiceReport.tsx"

with open(radiography_file, 'r', encoding='utf-8') as f:
    radio_content = f.read()

def extract_section(section_name_start_regex, end_regex="__EOF__"):
    match = re.search(section_name_start_regex, radio_content)
    if not match: return "ERROR: " + section_name_start_regex
    start = match.start()
    
    if end_regex != "__EOF__":
        end_match = re.search(end_regex, radio_content[start+10:])
        if end_match:
            return radio_content[start:start+10+end_match.start()].strip()
            
    # Simple brace counting to extract outer div if end_regex not provided
    end_match = re.search(r"\{\/\*\s*\d+\.\s*", radio_content[start+10:])
    if end_match:
        return radio_content[start : start+10+end_match.start()].strip()
    return ""

central_beam = extract_section(r"\{\/\* 3\. Central Beam Alignment \*\/\}")
effective_focal = extract_section(r"\{\/\* 5\. Effective Focal Spot \s*\*\/\}") # Radiography has {testData.effectiveFocalSpot && ( ... )} around line 598
accuracy_kvp = extract_section(r"\{\/\* 6\. Accuracy of Operating Potential \*\/\}")
consistency_rad = extract_section(r"\{\/\* 8\. Output Consistency \*\/\}")
radiation_protection = extract_section(r"\{\/\* 10\. Radiation Protection Survey \*\/\}", r"\{\/\* No data fallback \*\/\}")

print("Central Beam length:", len(central_beam))
print("Effective focal length:", len(effective_focal))
print("Accuracy Kvp length:", len(accuracy_kvp))
print("Consistency Rad length:", len(consistency_rad))
print("Rad Pro length:", len(radiation_protection))

# Now we transform testData.KEY to sectionData
import json
print(json.dumps({
  "central": central_beam[:100],
  "effective": effective_focal[:100],
  "accuracy": accuracy_kvp[:100],
  "consistency": consistency_rad[:100],
  "radiation": radiation_protection[:100]
}, indent=2))
