Project Overview


This proposal covers the development of a custom GoHighLevel (GHL) Appointment Map & Location-Based Scheduling Tool, delivered as a Custom Menu Link inside the GHL sub-account. The tool gives appointment setters a visual, map-based view of upcoming appointments before they schedule new ones, so they can assign work to representatives who are already operating nearby and cut down on unnecessary travel time.
Setters will be able to view upcoming appointments on a map, search by location, filter by representative and date, and inspect appointment details on hover — all before booking a new appointment through the standard GHL calendar.
This is a scheduling-assistance layer only. It does not replace or alter GHL's booking flow; appointment creation continues to happen inside the native GoHighLevel calendar as it does today.
Scope Of Work


The project will be completed as a single milestone, covering the full implementation from data integration and map rendering to filtering, optimization, testing, and final deployment.
Foundation & Custom Menu Link
1.1 Custom Menu Link Setup
▪  Configure the application as a GoHighLevel Custom Menu Link so setters can open it directly from the sub-account navigation.
▪  Wire up the existing HTML/UI structure, authentication method, and Google Maps integration from your current customer map so the appointment tool inherits the same look and login behavior.
Appointment & Contact Data Retrieval
2.1 Appointment Retrieval
▪  Retrieve appointments via the GoHighLevel Appointment API, returning only upcoming appointments — past and completed appointments are excluded from the map.
▪  Pull the required appointment fields: Appointment ID, Contact ID, Assigned User, Appointment Date, Appointment Time, and Appointment Status.
2.2 Progressive Batch Loading
▪  Fetch appointments in batches of 100 records per request and display them on the map immediately as each batch arrives.
▪  Continue loading the remaining appointments in the background until all available records are processed, so the initial view renders fast without waiting on the full dataset.
2.3 Contact Information Retrieval
▪  For every retrieved appointment, fetch the associated contact record via the Contact API to obtain the location data that appointments alone do not contain.
▪  Combine appointment and contact data (Full Address, City, State, Zip, Latitude, Longitude, Company Name) into a single unified record before rendering on the map.
Map Rendering, Filtering & Search
3.1 Google Map Display
▪  Render each upcoming appointment as a marker on Google Maps, positioned using the contact's latitude and longitude.
▪  Automatically update the displayed markers whenever a filter or search is applied.
3.2 Representative & Date Filtering
▪  Filter appointments by assigned sales representative, with multi-select support so setters can view several reps at once.
▪  Provide date filtering with a default view of upcoming appointments from today, plus specific-date and date-range selection. Dates earlier than the current date cannot be selected.
3.3 Location Search
▪  Reuse the existing location search so setters can search appointments by Full Address, City, State, or Zip Code, with matching appointments highlighted on the map.
3.4 Local Filtering & Performance
▪  Once appointment and contact data is loaded, perform all searching and filtering locally on the loaded dataset — the tool does not re-query the Contact API on every search.
▪  This keeps searches instant and avoids scanning the entire contact database on each request.
Appointment Tooltips & Final Polish
4.1 Appointment Information Tooltip
▪  Display a detailed tooltip on marker hover, showing available appointment information such as Contact Name, Assigned Representative, Appointment Date and Time, Company Name, Full Address, Postal Code, and Latitude/Longitude.
▪  Include Service Type, Vendor Name, and any additional appointment details where those fields are available from the APIs.
4.2 Integration, Testing & Handover
▪  Integrate the new functionality cleanly into the existing map codebase and verify the full setter workflow end to end.
▪  Test progressive loading, filtering, search, and tooltip behavior against live GHL data, then hand over the completed Custom Menu Link.
Estimated Time


All payments will be phase-based — 100% is due upfront at the start of each phase. The total project cost is $X USD, with an estimated turnaround time of 8 Business Days for full completion, depending on timely approvals and feedback.
Milestone
Title
ETA (Business Days)
Working Hours (Hrs)
1
Appointment Mapping Tool
8
18


Deliverables




▪  Custom GoHighLevel Menu Link hosting the Appointment Map tool
▪  Appointment retrieval via the GoHighLevel Appointment API (upcoming appointments only)
▪  Contact information retrieval via the Contact API, combined with appointment data
▪  Google Maps integration with a marker per upcoming appointment
▪  Progressive batch loading (100 records per request) with immediate rendering
▪  Representative filtering with multi-select support
▪  Date and date-range filtering (no past dates selectable)
▪  Location search by Full Address, City, State, and Zip Code
▪  Interactive appointment markers with detailed hover tooltips
▪  Local search and filtering logic performed on the loaded dataset
▪  Integration with your existing map codebase
