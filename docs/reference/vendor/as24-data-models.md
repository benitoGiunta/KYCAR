
<!---
This file is auto-generated, do not edit it.
Please read the section "Generating the data models documentation" from the README
and here
-->
      
# Data models

## Available attributes per vehicle type
The following matrix represents which attributes can be sent when creating or updating a listing, depending on its vehicle type and other constraints, and therefore it corresponds to the [ListingPayload](data-models.md?id=listingpayload) data model.

Note that upon reading a listing many of this constraints are relaxed (refer to the [Listing](data-models.md?id=listing) data model for details).


<strong>Legend</strong>
<ul>
    <li>✅ - Can be optionally set for this vehicle type</li>
    <li>✅⚠️ - Must be always set for this vehicle type</li>
    <li>✅⚠️❓ - Must be set for this vehicle type in some cases, depending on other attributes</li>
    <li>🚫 - Not available for this vehicle type</li>
</ul>


<div style="margin-bottom: 1em; padding: 0.5em; background: #f5f5f5; border-radius: 4px;">
  <strong>Show vehicle types not available in Europe:</strong>
  <label style="margin-left: 1em; cursor: pointer;">
    <input type="checkbox" id="toggle-new-vehicles" onchange="toggleNewVehicleColumns()">
    Agricultural, Heavy Equipment, Boat, Personal Watercraft
  </label>
</div>


<table id="vehicle-matrix">
  <thead>
    <tr>
      <th></th>
      <th class=""><div style="display: inline-block; vertical-align: middle; width: 1.5em; margin-right: 0.5em">
<svg class="icon--car" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 24 24" xml:space="preserve"><g><path d="M19,11h-1.4l-2.4-4c-0.4-0.6-1-1-1.7-1H5.6C4.9,6,4.2,6.4,3.9,7l-2.6,4.3c-0.2,0.3-0.3,0.7-0.3,1V18
		c0,1.1,0.9,2,2,2h1.2c0.4,1.2,1.5,2,2.8,2s2.4-0.8,2.8-2h4.4c0.4,1.2,1.5,2,2.8,2s2.4-0.8,2.8-2H21c1.1,0,2-0.9,2-2v-3
		C23,12.8,21.2,11,19,11z M7,20c-0.6,0-1-0.4-1-1s0.4-1,1-1s1,0.4,1,1S7.6,20,7,20z M17,20c-0.6,0-1-0.4-1-1s0.4-1,1-1s1,0.4,1,1
		S17.6,20,17,20z M21,18h-1.2c-0.4-1.2-1.5-2-2.8-2s-2.4,0.8-2.8,2H9.8c-0.4-1.2-1.5-2-2.8-2s-2.4,0.8-2.8,2H3v-5h3c0.6,0,1-0.4,1-1
		s-0.4-1-1-1H3.8l1.8-3h7.9l2.7,4.5c0.2,0.3,0.5,0.5,0.9,0.5h2c1.1,0,2,0.9,2,2V18z"></path><path d="M12,10c-0.6,0-1,0.4-1,1v1c0,0.6,0.4,1,1,1s1-0.4,1-1v-1C13,10.4,12.6,10,12,10z"></path></g></svg>
</div><div style="display: inline-block; vertical-align: middle">Car</div></th>
      <th class=""><div style="display: inline-block; vertical-align: middle; width: 1.5em; margin-right: 0.5em">
<svg class="icon--car" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 24 24" xml:space="preserve"><g id="Icons"><g><path d="M19,22c-2.206,0-4-1.794-4-4s1.794-4,4-4s4,1.794,4,4S21.206,22,19,22z M19,16c-1.103,0-2,0.897-2,2
			s0.897,2,2,2s2-0.897,2-2S20.102,16,19,16z"></path></g><g><path d="M5,22c-2.206,0-4-1.794-4-4s1.794-4,4-4s4,1.794,4,4S7.206,22,5,22z M5,16c-1.103,0-2,0.897-2,2s0.897,2,2,2
			s2-0.897,2-2S6.102,16,5,16z"></path></g><g><path d="M8.249,13c-0.103,0-0.205-0.016-0.305-0.047l-6.249-2c-0.526-0.168-0.816-0.731-0.647-1.257
			c0.168-0.526,0.727-0.816,1.257-0.648l5.767,1.846l2.341-1.702C10.583,9.067,10.789,9,11,9h3.998c0.553,0,1,0.448,1,1
			s-0.447,1-1,1h-3.673l-2.488,1.809C8.664,12.935,8.458,13,8.249,13z"></path></g><g><path d="M13,19h-2c-0.553,0-1-0.448-1-1s0.447-1,1-1h2c0.553,0,1,0.448,1,1S13.552,19,13,19z"></path></g><g><path d="M20,13c-0.552,0-1-0.447-1-1l-0.002-2.586l-2.707-2.708c-0.391-0.391-0.391-1.023,0-1.414
			s1.023-0.391,1.414,0l3,3C20.892,8.48,20.998,8.734,20.998,9L21,12C21,12.552,20.552,13,20,13C20,13,20,13,20,13z"></path></g></g></svg>
</div><div style="display: inline-block; vertical-align: middle">Bike</div></th>
      <th class=""><div style="display: inline-block; vertical-align: middle; width: 1.5em; margin-right: 0.5em">
<svg class="icon--car" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 24 24" xml:space="preserve"><g><path d="M22.4,9.8l-1.7-2.8C20,5.7,18.7,5,17.3,5H3C1.9,5,1,5.9,1,7v11c0,1.1,0.9,2,2,2h1.2c0.4,1.2,1.5,2,2.8,2
	s2.4-0.8,2.8-2h4.4c0.4,1.2,1.5,2,2.8,2s2.4-0.8,2.8-2H21c1.1,0,2-0.9,2-2v-6.2C23,11.1,22.8,10.4,22.4,9.8z M19,8l1.7,2.8
	c0,0.1,0.1,0.1,0.1,0.2H16V7h1.3C18,7,18.7,7.4,19,8z M7,20c-0.6,0-1-0.4-1-1s0.4-1,1-1s1,0.4,1,1S7.6,20,7,20z M17,20
	c-0.6,0-1-0.4-1-1s0.4-1,1-1s1,0.4,1,1S17.6,20,17,20z M19.8,18c-0.4-1.2-1.5-2-2.8-2s-2.4,0.8-2.8,2H9.8c-0.4-1.2-1.5-2-2.8-2
	s-2.4,0.8-2.8,2H3v-5h2c0.6,0,1-0.4,1-1s-0.4-1-1-1H3V7h11v4c0,1.1,0.9,2,2,2h5v5H19.8z"></path></g></svg>
</div><div style="display: inline-block; vertical-align: middle">Light commercial vehicle</div></th>
      <th class=""><div style="display: inline-block; vertical-align: middle; width: 1.5em; margin-right: 0.5em">
<svg class="icon--car" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 24 24" xml:space="preserve"><g><path d="M23,8V7c0-2.2-1.8-4-4-4H3C1.9,3,1,3.9,1,5v13c0,1.1,0.9,2,2,2h1.2c0.4,1.2,1.5,2,2.8,2s2.4-0.8,2.8-2h4.4
		c0.4,1.2,1.5,2,2.8,2s2.4-0.8,2.8-2H21c1.1,0,2-0.9,2-2v-5v-2c0-0.8-0.2-1.5-0.6-2.1C22.8,8.8,23,8.4,23,8z M7,20c-0.6,0-1-0.4-1-1
		s0.4-1,1-1s1,0.4,1,1S7.6,20,7,20z M17,20c-0.6,0-1-0.4-1-1s0.4-1,1-1s1,0.4,1,1S17.6,20,17,20z M19.8,18c-0.4-1.2-1.5-2-2.8-2
		s-2.4,0.8-2.8,2H9.8c-0.4-1.2-1.5-2-2.8-2s-2.4,0.8-2.8,2H3V5h7v8c0,0.6,0.4,1,1,1s1-0.4,1-1V5h7c1.1,0,2,0.9,2,2h-2h-2.6H15
		c-0.6,0-1,0.4-1,1v5c0,0.6,0.4,1,1,1h6v4H19.8z M21,11v1h-5V9h0.4H19C20.1,9,21,9.9,21,11z"></path><path d="M8,11c-0.6,0-1,0.4-1,1v1c0,0.6,0.4,1,1,1s1-0.4,1-1v-1C9,11.4,8.6,11,8,11z"></path></g></svg>
</div><div style="display: inline-block; vertical-align: middle">Caravan/mobile home</div></th>
      <th class=""><div style="display: inline-block; vertical-align: middle; width: 1.5em; margin-right: 0.5em">
<svg class="icon--car" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 24 24" xml:space="preserve"><g><path d="M22.4,9.8l-1.7-2.8C20,5.7,18.7,5,17.3,5H3C1.9,5,1,5.9,1,7v11c0,1.1,0.9,2,2,2h1.2c0.4,1.2,1.5,2,2.8,2
	s2.4-0.8,2.8-2h4.4c0.4,1.2,1.5,2,2.8,2s2.4-0.8,2.8-2H21c1.1,0,2-0.9,2-2v-6.2C23,11.1,22.8,10.4,22.4,9.8z M19,8l1.7,2.8
	c0,0.1,0.1,0.1,0.1,0.2H16V7h1.3C18,7,18.7,7.4,19,8z M7,20c-0.6,0-1-0.4-1-1s0.4-1,1-1s1,0.4,1,1S7.6,20,7,20z M17,20
	c-0.6,0-1-0.4-1-1s0.4-1,1-1s1,0.4,1,1S17.6,20,17,20z M19.8,18c-0.4-1.2-1.5-2-2.8-2s-2.4,0.8-2.8,2H9.8c-0.4-1.2-1.5-2-2.8-2
	s-2.4,0.8-2.8,2H3v-5h2c0.6,0,1-0.4,1-1s-0.4-1-1-1H3V7h11v4c0,1.1,0.9,2,2,2h5v5H19.8z"></path></g></svg>
</div><div style="display: inline-block; vertical-align: middle">Trailer</div></th>
      <th class="non-european-vehicle-types" data-vehicle-id="A"><div style="display: inline-block; vertical-align: middle; width: 1.5em; margin-right: 0.5em"></div><div style="display: inline-block; vertical-align: middle">Agricultural</div></th>
      <th class="non-european-vehicle-types" data-vehicle-id="E"><div style="display: inline-block; vertical-align: middle; width: 1.5em; margin-right: 0.5em"></div><div style="display: inline-block; vertical-align: middle">Heavy Equipment</div></th>
      <th class="non-european-vehicle-types" data-vehicle-id="O"><div style="display: inline-block; vertical-align: middle; width: 1.5em; margin-right: 0.5em"></div><div style="display: inline-block; vertical-align: middle">Boat</div></th>
      <th class="non-european-vehicle-types" data-vehicle-id="W"><div style="display: inline-block; vertical-align: middle; width: 1.5em; margin-right: 0.5em"></div><div style="display: inline-block; vertical-align: middle">Personal Watercraft</div></th>
      <th class="non-european-vehicle-types" data-vehicle-id="S"><div style="display: inline-block; vertical-align: middle; width: 1.5em; margin-right: 0.5em"></div><div style="display: inline-block; vertical-align: middle">Snowmobile</div></th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><a href="#/data-models?id=data-models-property-listingpayload-additionalfueltypes">additionalFuelTypes</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-listingpayload-alloywheelsize">alloyWheelSize</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Not available for this vehicle type">🚫</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-listingpayload-auxiliarypower">auxiliaryPower</a>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Not available for this vehicle type">🚫</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-listingpayload-availability">availability</a>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-availability-availabilitytype">availability.availabilityType</a>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-availability-deliverydate">availability.deliveryDate</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-availability-deliverydays">availability.deliveryDays</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-listingpayload-axlecount">axleCount</a>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Not available for this vehicle type">🚫</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-listingpayload-axlespread">axleSpread</a>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Not available for this vehicle type">🚫</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-listingpayload-battery">battery</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-batterypayload-bidirectionalchargingtypes">battery.bidirectionalChargingTypes</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-batterypayload-capacity">battery.capacity</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-batterypayload-chargingtime">battery.chargingTime</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-batterypayload-chargingtime10to80minutes">battery.chargingTime10to80Minutes</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-batterypayload-ownershiptype">battery.ownershipType</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-batterypayload-plugtypes">battery.plugTypes</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-batterypayload-stateofhealth">battery.stateOfHealth</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-batterypayload-warrantymileage">battery.warrantyMileage</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-batterypayload-warrantyperiod">battery.warrantyPeriod</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-listingpayload-bedcount">bedCount</a>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Not available for this vehicle type">🚫</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-listingpayload-belgiancarpassmileageurl">belgianCarpassMileageUrl</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Not available for this vehicle type">🚫</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-listingpayload-bodycolor">bodyColor</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-listingpayload-bodycolorname">bodyColorName</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-listingpayload-bodytype">bodyType</a>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Not available for this vehicle type">🚫</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-listingpayload-braketype">brakeType</a>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Not available for this vehicle type">🚫</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-listingpayload-cabinaxledistance">cabinAxleDistance</a>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Not available for this vehicle type">🚫</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-listingpayload-chassisbedlength">chassisBedLength</a>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Not available for this vehicle type">🚫</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-listingpayload-chassismanufacturername">chassisManufacturerName</a>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Not available for this vehicle type">🚫</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-listingpayload-co2emissions">co2Emissions</a>
      <td class=""><span title="Must be set for this vehicle type in some cases, depending on other attributes">✅⚠️❓</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-listingpayload-condition">condition</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-condition-description">condition.description</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-condition-hadaccident">condition.hadAccident</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-condition-hasrepaireddamages">condition.hasRepairedDamages</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-condition-iscabinclean">condition.isCabinClean</a>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Not available for this vehicle type">🚫</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-condition-iscurrentlydamaged">condition.isCurrentlyDamaged</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-condition-isroadworthy">condition.isRoadworthy</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-listingpayload-consumption">consumption</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-consumption-combined">consumption.combined</a>
      <td class=""><span title="Must be set for this vehicle type in some cases, depending on other attributes">✅⚠️❓</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-consumption-electriccombined">consumption.electricCombined</a>
      <td class=""><span title="Must be set for this vehicle type in some cases, depending on other attributes">✅⚠️❓</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-listingpayload-costmodel">costModel</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-costmodelpayload-co2costs">costModel.co2Costs</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-costmodelpayload-consumptioncosts">costModel.consumptionCosts</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-costmodelpayload-consumptioncostsyear">costModel.consumptionCostsYear</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-costmodelpayload-energyprice">costModel.energyPrice</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-costmodelpayload-fuelprice">costModel.fuelPrice</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-costmodelpayload-timeframe">costModel.timeFrame</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-costmodelpayload-vehicletax">costModel.vehicleTax</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-listingpayload-countryversion">countryVersion</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-listingpayload-crossreferenceid">crossReferenceId</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-listingpayload-cylindercapacity">cylinderCapacity</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-listingpayload-cylindercount">cylinderCount</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-listingpayload-description">description</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-listingpayload-differentialratio">differentialRatio</a>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Not available for this vehicle type">🚫</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-listingpayload-doorcount">doorCount</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Not available for this vehicle type">🚫</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-listingpayload-drivetrain">drivetrain</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-listingpayload-drivingmode">drivingMode</a>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-listingpayload-ecode">eCode</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Not available for this vehicle type">🚫</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-listingpayload-efficiencyclass">efficiencyClass</a>
      <td class=""><span title="Must be set for this vehicle type in some cases, depending on other attributes">✅⚠️❓</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Not available for this vehicle type">🚫</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-listingpayload-electricrange">electricRange</a>
      <td class=""><span title="Must be set for this vehicle type in some cases, depending on other attributes">✅⚠️❓</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-listingpayload-electricrangecity">electricRangeCity</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-listingpayload-emptyweight">emptyWeight</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-listingpayload-emptyweightgrams">emptyWeightGrams</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-listingpayload-enginecoolingsystem">engineCoolingSystem</a>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-listingpayload-enginecount">engineCount</a>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Not available for this vehicle type">🚫</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-listingpayload-enginehours">engineHours</a>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Not available for this vehicle type">🚫</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-listingpayload-enginemanufacturername">engineManufacturerName</a>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Not available for this vehicle type">🚫</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-listingpayload-enginemountingtype">engineMountingType</a>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Not available for this vehicle type">🚫</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-listingpayload-equipment">equipment</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-listingpayload-euemissionstandard">euEmissionStandard</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Not available for this vehicle type">🚫</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-listingpayload-europalletstoragespaces">europalletStorageSpaces</a>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Not available for this vehicle type">🚫</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-listingpayload-extendedlength">extendedLength</a>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Not available for this vehicle type">🚫</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-listingpayload-exteriormaterial">exteriorMaterial</a>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Not available for this vehicle type">🚫</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-listingpayload-externalcustomerid">externalCustomerId</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-listingpayload-financingoffer">financingOffer</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-financingofferpayload-annualrate">financingOffer.annualRate</a>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-financingofferpayload-bank">financingOffer.bank</a>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-financingofferpayload-banksecondlanguage">financingOffer.bankSecondLanguage</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-financingofferpayload-closingcosts">financingOffer.closingCosts</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-financingofferpayload-currency">financingOffer.currency</a>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-financingofferpayload-debitinterestrate">financingOffer.debitInterestRate</a>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-financingofferpayload-debitinteresttype">financingOffer.debitInterestType</a>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-financingofferpayload-duration">financingOffer.duration</a>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-financingofferpayload-endingrate">financingOffer.endingRate</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-financingofferpayload-financingtype">financingOffer.financingType</a>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-financingofferpayload-grosscreditamount">financingOffer.grossCreditAmount</a>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-financingofferpayload-initialpayment">financingOffer.initialPayment</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-financingofferpayload-monthlyrate">financingOffer.monthlyRate</a>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-financingofferpayload-netcreditamount">financingOffer.netCreditAmount</a>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-financingofferpayload-paymentprotectioninsurance">financingOffer.paymentProtectionInsurance</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-listingpayload-firstmodelsproductiondate">firstModelsProductionDate</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-listingpayload-firstregistrationdate">firstRegistrationDate</a>
      <td class=""><span title="Must be set for this vehicle type in some cases, depending on other attributes">✅⚠️❓</span></td>
      <td class=""><span title="Must be set for this vehicle type in some cases, depending on other attributes">✅⚠️❓</span></td>
      <td class=""><span title="Must be set for this vehicle type in some cases, depending on other attributes">✅⚠️❓</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-listingpayload-flooringmaterial">flooringMaterial</a>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Not available for this vehicle type">🚫</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-listingpayload-fridgecapacity">fridgeCapacity</a>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Not available for this vehicle type">🚫</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-listingpayload-fridgecapacitymilliliters">fridgeCapacityMilliliters</a>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Not available for this vehicle type">🚫</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-listingpayload-fridgepowertype">fridgePowerType</a>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Not available for this vehicle type">🚫</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-listingpayload-frontaxleweightrating">frontAxleWeightRating</a>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Not available for this vehicle type">🚫</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-listingpayload-frontaxleweightratinggrams">frontAxleWeightRatingGrams</a>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Not available for this vehicle type">🚫</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-listingpayload-fuelcapacity">fuelCapacity</a>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-listingpayload-fuelcapacitymilliliters">fuelCapacityMilliliters</a>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-listingpayload-fuelcategory">fuelCategory</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-listingpayload-fueldeliverytype">fuelDeliveryType</a>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-listingpayload-gearcount">gearCount</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-listingpayload-germanemissionssticker">germanEmissionsSticker</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Not available for this vehicle type">🚫</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-listingpayload-grossvehicleweight">grossVehicleWeight</a>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-listingpayload-grossvehicleweightgrams">grossVehicleWeightGrams</a>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-listingpayload-hascarregistration">hasCarRegistration</a>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Not available for this vehicle type">🚫</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-listingpayload-hasfullservicehistory">hasFullServiceHistory</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-listingpayload-hasparticlefilter">hasParticleFilter</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-listingpayload-haswarranty">hasWarranty</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-listingpayload-headcount">headCount</a>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Not available for this vehicle type">🚫</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-listingpayload-highlights">highlights</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-listingpayload-hsn">hsn</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-listingpayload-hullmaterial">hullMaterial</a>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Not available for this vehicle type">🚫</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-listingpayload-images">images</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-imagepayload-id">images.id</a>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-listingpayload-images">images</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-imagepayload-id">images.id</a>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-listingpayload-includedservices">includedServices</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-listingpayload-iseureimport">isEUReimport</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Not available for this vehicle type">🚫</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-listingpayload-ismetallic">isMetallic</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-listingpayload-isnonsmoking">isNonSmoking</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Not available for this vehicle type">🚫</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-listingpayload-ispluginhybrid">isPluginHybrid</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-listingpayload-isreserved">isReserved</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-listingpayload-lastcambeltservicedate">lastCamBeltServiceDate</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-listingpayload-lasttechnicalservicedate">lastTechnicalServiceDate</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-listingpayload-leasingoffers">leasingOffers</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-leasingofferspayload-offers">leasingOffers.offers</a>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-leasingofferpayload-additionaldistancecost">leasingOffers.offers.additionalDistanceCost</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-leasingofferpayload-bank">leasingOffers.offers.bank</a>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-leasingofferpayload-borrowingrate">leasingOffers.offers.borrowingRate</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-leasingofferpayload-borrowingratetype">leasingOffers.offers.borrowingRateType</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-leasingofferpayload-conditions">leasingOffers.offers.conditions</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-leasingofferpayload-contracttype">leasingOffers.offers.contractType</a>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-leasingofferpayload-dieselenvironmentalbonus">leasingOffers.offers.dieselEnvironmentalBonus</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-leasingofferpayload-downpayment">leasingOffers.offers.downPayment</a>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-leasingofferpayload-duration">leasingOffers.offers.duration</a>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-leasingofferpayload-effectiveinterestrate">leasingOffers.offers.effectiveInterestRate</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-leasingofferpayload-finalinstallment">leasingOffers.offers.finalInstallment</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-leasingofferpayload-grosslistprice">leasingOffers.offers.grossListPrice</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-leasingofferpayload-grossmonthlyrate">leasingOffers.offers.grossMonthlyRate</a>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-leasingofferpayload-hasregistrationcostsincluded">leasingOffers.offers.hasRegistrationCostsIncluded</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-leasingofferpayload-hastransfercostsincluded">leasingOffers.offers.hasTransferCostsIncluded</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-leasingofferpayload-includedmileage">leasingOffers.offers.includedMileage</a>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-leasingofferpayload-istradeinpossible">leasingOffers.offers.isTradeInPossible</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-leasingofferpayload-leasetotalamount">leasingOffers.offers.leaseTotalAmount</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-leasingofferpayload-negotiable">leasingOffers.offers.negotiable</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-leasingofferpayload-netloanamount">leasingOffers.offers.netLoanAmount</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-leasingofferpayload-netmonthlyrate">leasingOffers.offers.netMonthlyRate</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-leasingofferpayload-referenceofferid">leasingOffers.offers.referenceOfferId</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-leasingofferpayload-refundforlessdistance">leasingOffers.offers.refundForLessDistance</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-leasingofferpayload-registrationcosts">leasingOffers.offers.registrationCosts</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-leasingofferpayload-targetgroup">leasingOffers.offers.targetGroup</a>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-leasingofferpayload-transfercosts">leasingOffers.offers.transferCosts</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-leasingofferspayload-providerid">leasingOffers.providerId</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-listingpayload-licenceplate">licencePlate</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-listingpayload-loadheight">loadHeight</a>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Not available for this vehicle type">🚫</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-listingpayload-loadlength">loadLength</a>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Not available for this vehicle type">🚫</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-listingpayload-loadvolume">loadVolume</a>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Not available for this vehicle type">🚫</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-listingpayload-loadwidth">loadWidth</a>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Not available for this vehicle type">🚫</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-listingpayload-make">make</a>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-listingpayload-marketing">marketing</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-partialmarketingpayload-listingboost">marketing.listingBoost</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-partiallistingboostpayload-requested">marketing.listingBoost.requested</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-partialmarketingpayload-mia">marketing.mia</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-partialmiapayload-requestedtier">marketing.mia.requestedTier</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-partialmiapayload-subtitle">marketing.mia.subtitle</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-listingpayload-marketing">marketing</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-marketingpayload-exclusiveoffer">marketing.exclusiveOffer</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-exclusiveofferpayload-description">marketing.exclusiveOffer.description</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-exclusiveofferpayload-enddate">marketing.exclusiveOffer.endDate</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-marketingpayload-listingboost">marketing.listingBoost</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-listingboostpayload-requested">marketing.listingBoost.requested</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-marketingpayload-mia">marketing.mia</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-miapayload-requestedtier">marketing.mia.requestedTier</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-miapayload-subtitle">marketing.mia.subtitle</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-marketingpayload-redpencil">marketing.redPencil</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-listingpayload-maximumtowingweight">maximumTowingWeight</a>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Not available for this vehicle type">🚫</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-listingpayload-mileage">mileage</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-listingpayload-model">model</a>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Not available for this vehicle type">🚫</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-listingpayload-modelname">modelName</a>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-listingpayload-modelversion">modelVersion</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-listingpayload-natcode">natCode</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-listingpayload-nextinspectiondate">nextInspectionDate</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-listingpayload-offerreferenceid">offerReferenceId</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-listingpayload-offertype">offerType</a>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-listingpayload-oilcapacity">oilCapacity</a>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-listingpayload-oilcapacitymilliliters">oilCapacityMilliliters</a>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-listingpayload-payload">payload</a>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-listingpayload-power">power</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-listingpayload-previousownercount">previousOwnerCount</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-listingpayload-prices">prices</a>
      <td class=""><span title="Must be set for this vehicle type in some cases, depending on other attributes">✅⚠️❓</span></td>
      <td class=""><span title="Must be set for this vehicle type in some cases, depending on other attributes">✅⚠️❓</span></td>
      <td class=""><span title="Must be set for this vehicle type in some cases, depending on other attributes">✅⚠️❓</span></td>
      <td class=""><span title="Must be set for this vehicle type in some cases, depending on other attributes">✅⚠️❓</span></td>
      <td class=""><span title="Must be set for this vehicle type in some cases, depending on other attributes">✅⚠️❓</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Must be set for this vehicle type in some cases, depending on other attributes">✅⚠️❓</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Must be set for this vehicle type in some cases, depending on other attributes">✅⚠️❓</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Must be set for this vehicle type in some cases, depending on other attributes">✅⚠️❓</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Must be set for this vehicle type in some cases, depending on other attributes">✅⚠️❓</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Must be set for this vehicle type in some cases, depending on other attributes">✅⚠️❓</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-prices-dealer">prices.dealer</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-dealerprice-currency">prices.dealer.currency</a>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-dealerprice-netprice">prices.dealer.netPrice</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-dealerprice-price">prices.dealer.price</a>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-dealerprice-vatrate">prices.dealer.vatRate</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-prices-manufacturerssuggestedretail">prices.manufacturersSuggestedRetail</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-retailprice-currency">prices.manufacturersSuggestedRetail.currency</a>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-retailprice-price">prices.manufacturersSuggestedRetail.price</a>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-prices-public">prices.public</a>
      <td class=""><span title="Must be set for this vehicle type in some cases, depending on other attributes">✅⚠️❓</span></td>
      <td class=""><span title="Must be set for this vehicle type in some cases, depending on other attributes">✅⚠️❓</span></td>
      <td class=""><span title="Must be set for this vehicle type in some cases, depending on other attributes">✅⚠️❓</span></td>
      <td class=""><span title="Must be set for this vehicle type in some cases, depending on other attributes">✅⚠️❓</span></td>
      <td class=""><span title="Must be set for this vehicle type in some cases, depending on other attributes">✅⚠️❓</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Must be set for this vehicle type in some cases, depending on other attributes">✅⚠️❓</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Must be set for this vehicle type in some cases, depending on other attributes">✅⚠️❓</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Must be set for this vehicle type in some cases, depending on other attributes">✅⚠️❓</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Must be set for this vehicle type in some cases, depending on other attributes">✅⚠️❓</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Must be set for this vehicle type in some cases, depending on other attributes">✅⚠️❓</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-publicprice-currency">prices.public.currency</a>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-publicprice-germanenvironmentalgrant">prices.public.germanEnvironmentalGrant</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-discount-fixedamount">prices.public.germanEnvironmentalGrant.fixedAmount</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-discount-pricealreadydiscounted">prices.public.germanEnvironmentalGrant.priceAlreadyDiscounted</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-publicprice-isnegotiable">prices.public.isNegotiable</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-publicprice-istaxdeductible">prices.public.isTaxDeductible</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-publicprice-netprice">prices.public.netPrice</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-publicprice-price">prices.public.price</a>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-publicprice-vatrate">prices.public.vatRate</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-listingpayload-primaryfueltype">primaryFuelType</a>
      <td class=""><span title="Must be set for this vehicle type in some cases, depending on other attributes">✅⚠️❓</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-listingpayload-productionyear">productionYear</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-listingpayload-publication">publication</a>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-publicationpayload-channels">publication.channels</a>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-channelreference-id">publication.channels.id</a>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-publicationpayload-status">publication.status</a>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-listingpayload-rearaxleweightrating">rearAxleWeightRating</a>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Not available for this vehicle type">🚫</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-listingpayload-rearaxleweightratinggrams">rearAxleWeightRatingGrams</a>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Not available for this vehicle type">🚫</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-listingpayload-requestedseals">requestedSeals</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-listingpayload-schwackecode">schwackeCode</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-listingpayload-sealsoverwriteprotection">sealsOverwriteProtection</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-listingpayload-seatcount">seatCount</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-listingpayload-skistancewidth">skiStanceWidth</a>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-listingpayload-slideoutcount">slideOutCount</a>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Not available for this vehicle type">🚫</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-listingpayload-steeringtype">steeringType</a>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Not available for this vehicle type">🚫</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-listingpayload-totalheight">totalHeight</a>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-listingpayload-totallength">totalLength</a>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-listingpayload-totalwidth">totalWidth</a>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-listingpayload-transmission">transmission</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-listingpayload-tsn">tsn</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-listingpayload-twinner">twinner</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-twinnerpayload-key">twinner.key</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-listingpayload-upholsterycolor">upholsteryColor</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-listingpayload-upholsterytype">upholsteryType</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-listingpayload-vehicletype">vehicleType</a>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class=""><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Must be always set for this vehicle type">✅⚠️</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-listingpayload-vin">vin</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-listingpayload-warranty">warranty</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-listingpayload-wascaborrental">wasCabOrRental</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-listingpayload-wastetankcapacity">wasteTankCapacity</a>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Not available for this vehicle type">🚫</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-listingpayload-wastetankcapacitymilliliters">wasteTankCapacityMilliliters</a>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Not available for this vehicle type">🚫</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-listingpayload-watertankcapacity">waterTankCapacity</a>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Not available for this vehicle type">🚫</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-listingpayload-watertankcapacitymilliliters">waterTankCapacityMilliliters</a>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Not available for this vehicle type">🚫</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-listingpayload-wheelbase">wheelbase</a>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Not available for this vehicle type">🚫</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-listingpayload-wltp">wltp</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-wltpcommon-co2class">wltp.co2Class</a>
      <td class=""><span title="Must be set for this vehicle type in some cases, depending on other attributes">✅⚠️❓</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-wltpcommon-co2classdischarged">wltp.co2ClassDischarged</a>
      <td class=""><span title="Must be set for this vehicle type in some cases, depending on other attributes">✅⚠️❓</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-wltpcommon-co2emissionscombined">wltp.co2EmissionsCombined</a>
      <td class=""><span title="Must be set for this vehicle type in some cases, depending on other attributes">✅⚠️❓</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-wltpcommon-co2emissionscombinedweighted">wltp.co2EmissionsCombinedWeighted</a>
      <td class=""><span title="Must be set for this vehicle type in some cases, depending on other attributes">✅⚠️❓</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-wltpcommon-co2emissionsdischarged">wltp.co2EmissionsDischarged</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-wltpcommon-consumptioncity">wltp.consumptionCity</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-wltpcommon-consumptioncitydischarged">wltp.consumptionCityDischarged</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-wltpcommon-consumptioncombined">wltp.consumptionCombined</a>
      <td class=""><span title="Must be set for this vehicle type in some cases, depending on other attributes">✅⚠️❓</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-wltpcommon-consumptioncombineddischarged">wltp.consumptionCombinedDischarged</a>
      <td class=""><span title="Must be set for this vehicle type in some cases, depending on other attributes">✅⚠️❓</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-wltpcommon-consumptioncombinedweighted">wltp.consumptionCombinedWeighted</a>
      <td class=""><span title="Must be set for this vehicle type in some cases, depending on other attributes">✅⚠️❓</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-wltpcommon-consumptionelectriccity">wltp.consumptionElectricCity</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-wltpcommon-consumptionelectriccombined">wltp.consumptionElectricCombined</a>
      <td class=""><span title="Must be set for this vehicle type in some cases, depending on other attributes">✅⚠️❓</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-wltpcommon-consumptionelectriccombinedweighted">wltp.consumptionElectricCombinedWeighted</a>
      <td class=""><span title="Must be set for this vehicle type in some cases, depending on other attributes">✅⚠️❓</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Not available for this vehicle type">🚫</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-wltpcommon-consumptionelectrichighway">wltp.consumptionElectricHighway</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-wltpcommon-consumptionelectricrural">wltp.consumptionElectricRural</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-wltpcommon-consumptionelectricsuburban">wltp.consumptionElectricSuburban</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-wltpcommon-consumptionhighway">wltp.consumptionHighway</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-wltpcommon-consumptionhighwaydischarged">wltp.consumptionHighwayDischarged</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-wltpcommon-consumptionrural">wltp.consumptionRural</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-wltpcommon-consumptionruraldischarged">wltp.consumptionRuralDischarged</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-wltpcommon-consumptionsuburban">wltp.consumptionSuburban</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-wltpcommon-consumptionsuburbandischarged">wltp.consumptionSuburbanDischarged</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
    <tr>
      <td><a href="#/data-models?id=data-models-property-listingpayload-youtubevideourl">youtubeVideoUrl</a>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class=""><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="A"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="E"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="O"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="W"><span title="Can be optionally set for this vehicle type">✅</span></td>
      <td class="non-european-vehicle-types" data-vehicle-id="S"><span title="Can be optionally set for this vehicle type">✅</span></td>
  </tbody>
</table>

<style>
  .non-european-vehicle-types {
    display: none;
  }
  .non-european-vehicle-types.visible {
    display: table-cell;
  }
</style>


## All models

- <a href="#/data-models?id=autoproffconfiguration">AutoProffConfiguration</a>
- <a href="#/data-models?id=autoproff">Autoproff</a>
- <a href="#/data-models?id=availability">Availability</a>
- <a href="#/data-models?id=battery">Battery</a>
- <a href="#/data-models?id=batterypayload">BatteryPayload</a>
- <a href="#/data-models?id=channel">Channel</a>
- <a href="#/data-models?id=channelid">ChannelId</a>
- <a href="#/data-models?id=channelreference">ChannelReference</a>
- <a href="#/data-models?id=co2costs">Co2Costs</a>
- <a href="#/data-models?id=co2price">Co2Price</a>
- <a href="#/data-models?id=competitorvehicle">CompetitorVehicle</a>
- <a href="#/data-models?id=condition">Condition</a>
- <a href="#/data-models?id=consumption">Consumption</a>
- <a href="#/data-models?id=costmodel">CostModel</a>
- <a href="#/data-models?id=costmodelcommon">CostModelCommon</a>
- <a href="#/data-models?id=costmodelpayload">CostModelPayload</a>
- <a href="#/data-models?id=costmodelunits">CostModelUnits</a>
- <a href="#/data-models?id=culture">Culture</a>
- <a href="#/data-models?id=customer">Customer</a>
- <a href="#/data-models?id=customerconfiguration">CustomerConfiguration</a>
- <a href="#/data-models?id=customerseals">CustomerSeals</a>
- <a href="#/data-models?id=customers">Customers</a>
- <a href="#/data-models?id=dealerprice">DealerPrice</a>
- <a href="#/data-models?id=discount">Discount</a>
- <a href="#/data-models?id=error">Error</a>
- <a href="#/data-models?id=errorculture">ErrorCulture</a>
- <a href="#/data-models?id=errors">Errors</a>
- <a href="#/data-models?id=exclusiveoffer">ExclusiveOffer</a>
- <a href="#/data-models?id=exclusiveofferpayload">ExclusiveOfferPayload</a>
- <a href="#/data-models?id=fallbackattributesinteger">FallbackAttributesInteger</a>
- <a href="#/data-models?id=financingoffer">FinancingOffer</a>
- <a href="#/data-models?id=financingofferpayload">FinancingOfferPayload</a>
- <a href="#/data-models?id=highlight">Highlight</a>
- <a href="#/data-models?id=image">Image</a>
- <a href="#/data-models?id=imagemd5">ImageMd5</a>
- <a href="#/data-models?id=imagepayload">ImagePayload</a>
- <a href="#/data-models?id=imagepresignedurl">ImagePresignedUrl</a>
- <a href="#/data-models?id=imagereference">ImageReference</a>
- <a href="#/data-models?id=imagestandard">ImageStandard</a>
- <a href="#/data-models?id=leasingoffer">LeasingOffer</a>
- <a href="#/data-models?id=leasingofferpayload">LeasingOfferPayload</a>
- <a href="#/data-models?id=leasingoffers">LeasingOffers</a>
- <a href="#/data-models?id=leasingofferspayload">LeasingOffersPayload</a>
- <a href="#/data-models?id=listing">Listing</a>
- <a href="#/data-models?id=listingboost">ListingBoost</a>
- <a href="#/data-models?id=listingboostpayload">ListingBoostPayload</a>
- <a href="#/data-models?id=listingpayload">ListingPayload</a>
- <a href="#/data-models?id=listingsummary">ListingSummary</a>
- <a href="#/data-models?id=listings">Listings</a>
- <a href="#/data-models?id=make">Make</a>
- <a href="#/data-models?id=makes">Makes</a>
- <a href="#/data-models?id=marketing">Marketing</a>
- <a href="#/data-models?id=marketingpayload">MarketingPayload</a>
- <a href="#/data-models?id=marketplace">Marketplace</a>
- <a href="#/data-models?id=mia">Mia</a>
- <a href="#/data-models?id=miapayload">MiaPayload</a>
- <a href="#/data-models?id=model">Model</a>
- <a href="#/data-models?id=onlinesale">OnlineSale</a>
- <a href="#/data-models?id=partiallistingboostpayload">PartialListingBoostPayload</a>
- <a href="#/data-models?id=partiallistingpayload">PartialListingPayload</a>
- <a href="#/data-models?id=partialmarketingpayload">PartialMarketingPayload</a>
- <a href="#/data-models?id=partialmiapayload">PartialMiaPayload</a>
- <a href="#/data-models?id=price">Price</a>
- <a href="#/data-models?id=priceevaluationranges">PriceEvaluationRanges</a>
- <a href="#/data-models?id=priceevaluationresponse">PriceEvaluationResponse</a>
- <a href="#/data-models?id=prices">Prices</a>
- <a href="#/data-models?id=productsconfiguration">ProductsConfiguration</a>
- <a href="#/data-models?id=publicprice">PublicPrice</a>
- <a href="#/data-models?id=publication">Publication</a>
- <a href="#/data-models?id=publicationpayload">PublicationPayload</a>
- <a href="#/data-models?id=publicationstatus">PublicationStatus</a>
- <a href="#/data-models?id=reference">Reference</a>
- <a href="#/data-models?id=referencetype">ReferenceType</a>
- <a href="#/data-models?id=references">References</a>
- <a href="#/data-models?id=retailprice">RetailPrice</a>
- <a href="#/data-models?id=seal">Seal</a>
- <a href="#/data-models?id=seals">Seals</a>
- <a href="#/data-models?id=selectboostconfiguration">SelectBoostConfiguration</a>
- <a href="#/data-models?id=threesixtyimagescollection">ThreeSixtyImagesCollection</a>
- <a href="#/data-models?id=threesixtyimagescollectionimage">ThreeSixtyImagesCollectionImage</a>
- <a href="#/data-models?id=threesixtyimagescollectionimagepayload">ThreeSixtyImagesCollectionImagePayload</a>
- <a href="#/data-models?id=threesixtyimagescollectionpayload">ThreeSixtyImagesCollectionPayload</a>
- <a href="#/data-models?id=threesixtyimagescollections">ThreeSixtyImagesCollections</a>
- <a href="#/data-models?id=threesixtyvr">ThreeSixtyVr</a>
- <a href="#/data-models?id=threesixtyvrs">ThreeSixtyVrs</a>
- <a href="#/data-models?id=tier">Tier</a>
- <a href="#/data-models?id=twinnerpayload">TwinnerPayload</a>
- <a href="#/data-models?id=vehicletypeid">VehicleTypeId</a>
- <a href="#/data-models?id=vinenrichmentstatus">VinEnrichmentStatus</a>
- <a href="#/data-models?id=wltpcommon">WltpCommon</a>
- <a href="#/data-models?id=wltpunits">WltpUnits</a>

## AutoProffConfiguration
<table>
  <tbody>
    <tr>
      <th>Field name</th>
      <th>Type</th><th>Mandatory</th> <th>Other constraints</th>
      <th>Description</th>
      <th>Example</th>
    </tr>    <tr>
      <td class="propName" id="data-models-property-autoproffconfiguration-transferoption"><p>transferOption</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>Yes</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>The listing transfer option for AutoProff. This field is always present when the configuration object is included.</p>
        <p>Inactive and legacy modes are automatically mapped to "Deactivated".</p>
        <p>Possible values:</p>
        <p>- "Deactivated" (set for package-only customers without AutoProff, or when inactive/legacy transfer modes)</p>
        <p>- "Full Inventory Transfer Active"</p>
        <p>- "Manual Listing Transfer Active"</p>
      </td>
      <td class="propExample"><p><code>Deactivated</code></p></td>
    </tr>

  </tbody>
</table>


## Autoproff
<table>
  <tbody>
    <tr>
      <th>Field name</th>
      <th>Type</th><th>Mandatory</th> <th>Other constraints</th>
      <th>Description</th>
      <th>Example</th>
    </tr>    <tr>
      <td class="propName" id="data-models-property-autoproff-hasoffer"><p>hasOffer</p></td>
      <td class="propType"><p>boolean</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Indicates whether the listing currently has an Autoproff offer.</p>
      </td>
      <td class="propExample"><p><code>true</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-autoproff-mode"><p>mode</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li>Allowed values are: <code>write</code>, <code>read</code>, <code>ap_deleted</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Autoproff mode of the listing. Attribute can not be set.</p>
      </td>
      <td class="propExample"><p><code>write</code></p></td>
    </tr>

  </tbody>
</table>


## Availability
<table>
  <tbody>
    <tr>
      <th>Field name</th>
      <th>Type</th><th>Mandatory</th> <th>Other constraints</th>
      <th>Description</th>
      <th>Example</th>
    </tr>    <tr>
      <td class="propName" id="data-models-property-availability-availabilitytype"><p>availabilityType</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>Yes</p></td>      <td class="propConstraints">
        <ul>
          <li>Allowed values can be retrieved via the references API (reference type AvailabilityType)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>The availability of the vehicle. For example, "1" (available immediately)</p>
      </td>
      <td class="propExample"><p><code>1</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-availability-deliverydate"><p>deliveryDate</p></td>
      <td class="propType"><p>date</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li>Either <code>deliveryDate</code> or <code>deliveryDays</code> must be present if the vehicle is not available immediately (availabilityType <code>2</code> or <code>3</code>)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>The earliest date that the vehicle can be delivered</p>
      </td>
      <td class="propExample"><p><code>2018-12-01</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-availability-deliverydays"><p>deliveryDays</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li>Allowed values are: <code>1</code>, <code>2</code>, <code>3</code>, <code>4</code>, <code>5</code>, <code>6</code>, <code>7</code>, <code>14</code>, <code>21</code>, <code>28</code>, <code>42</code>, <code>60</code>, <code>90</code>, <code>120</code>, <code>150</code>, <code>180</code>, <code>270</code>, <code>360</code></li>
          <li>Either <code>deliveryDate</code> or <code>deliveryDays</code> must be present if the vehicle is not available immediately (availabilityType <code>2</code> or <code>3</code>)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>The number of days it will take to deliver the vehicle</p>
      </td>
      <td class="propExample"><p><code>7</code></p></td>
    </tr>

  </tbody>
</table>


## Battery
<table>
  <tbody>
    <tr>
      <th>Field name</th>
      <th>Type</th><th>Mandatory</th> <th>Other constraints</th>
      <th>Description</th>
      <th>Example</th>
    </tr>    <tr>
      <td class="propName" id="data-models-property-battery-bidirectionalchargingtypes"><p>bidirectionalChargingTypes</p></td>
      <td class="propType"><p>array[string]</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li>Items must be unique</li>
          <li>Allowed values can be retrieved via the references API (reference type BidirectionalChargingType).</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>A set of supported bidirectional charging types available at the vehicle.</p>
      </td>
      <td class="propExample"><p></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-battery-capacity"><p>capacity</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>0</code></li>
          <li class="numeric">Max. value: <code>999999</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>The capacity of the battery, in kWh.</p>
      </td>
      <td class="propExample"><p><code>5</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-battery-capacityunit"><p>capacityUnit</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Unit used for capacity field.</p>
      </td>
      <td class="propExample"><p><code>kWh</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-battery-chargingtime"><p>chargingTime</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>1</code></li>
          <li class="numeric">Max. value: <code>1439</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>The time the car needs at 11KW charging station (comparable to the charging power of a Wallbox installed</p>
        <p>at home). Notation in minutes, integer.</p>
      </td>
      <td class="propExample"><p><code>800</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-battery-chargingtime10to80minutes"><p>chargingTime10to80Minutes</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>1</code></li>
          <li class="numeric">Max. value: <code>25200</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>The time it takes in minutes to charge this car from 10% to 80% via the fastest way of charging.</p>
      </td>
      <td class="propExample"><p><code>800</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-battery-ownershiptype"><p>ownershipType</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Ownership type of the battery.</p>
      </td>
      <td class="propExample"><p><code>2</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-battery-plugtypes"><p>plugTypes</p></td>
      <td class="propType"><p>array[string]</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li>Items must be unique</li>
          <li>Allowed values can be retrieved via the references API (reference type PlugType).</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>A set of supported plug types available at the vehicle.</p>
      </td>
      <td class="propExample"><p></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-battery-stateofhealth"><p>stateOfHealth</p></td>
      <td class="propType"><p>number</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>0</code></li>
          <li class="numeric">Max. value: <code>100</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>The battery state of health percentage. Values must be greater than zero and have at most one decimal place.</p>
      </td>
      <td class="propExample"><p><code>92.5</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-battery-warrantymileage"><p>warrantyMileage</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>1</code></li>
          <li class="numeric">Max. value: <code>999999</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>The battery warranty mileage, in kilometers.</p>
      </td>
      <td class="propExample"><p><code>160000</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-battery-warrantyperiod"><p>warrantyPeriod</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>1</code></li>
          <li class="numeric">Max. value: <code>99</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>The battery warranty period, in years.</p>
      </td>
      <td class="propExample"><p><code>8</code></p></td>
    </tr>

  </tbody>
</table>


## BatteryPayload
<table>
  <tbody>
    <tr>
      <th>Field name</th>
      <th>Type</th><th>Mandatory</th> <th>Other constraints</th>
      <th>Description</th>
      <th>Example</th>
    </tr>    <tr>
      <td class="propName" id="data-models-property-batterypayload-bidirectionalchargingtypes"><p>bidirectionalChargingTypes</p></td>
      <td class="propType"><p>array[string]</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li>Items must be unique</li>
          <li>Allowed values can be retrieved via the references API (reference type BidirectionalChargingType).</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>A set of supported bidirectional charging types available at the vehicle.</p>
      </td>
      <td class="propExample"><p></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-batterypayload-capacity"><p>capacity</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>0</code></li>
          <li class="numeric">Max. value: <code>999999</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>The capacity of the battery, in kWh.</p>
      </td>
      <td class="propExample"><p><code>5</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-batterypayload-chargingtime"><p>chargingTime</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>1</code></li>
          <li class="numeric">Max. value: <code>1439</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>The time the car needs at 11KW charging station (comparable to the charging power of a Wallbox installed</p>
        <p>at home). Notation in minutes, integer.</p>
      </td>
      <td class="propExample"><p><code>800</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-batterypayload-chargingtime10to80minutes"><p>chargingTime10to80Minutes</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>1</code></li>
          <li class="numeric">Max. value: <code>25200</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>The time it takes in minutes to charge this car from 10% to 80% via the fastest way of charging.</p>
      </td>
      <td class="propExample"><p><code>800</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-batterypayload-ownershiptype"><p>ownershipType</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Ownership type of the battery.</p>
      </td>
      <td class="propExample"><p><code>2</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-batterypayload-plugtypes"><p>plugTypes</p></td>
      <td class="propType"><p>array[string]</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li>Items must be unique</li>
          <li>Allowed values can be retrieved via the references API (reference type PlugType).</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>A set of supported plug types available at the vehicle.</p>
      </td>
      <td class="propExample"><p></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-batterypayload-stateofhealth"><p>stateOfHealth</p></td>
      <td class="propType"><p>number</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>0</code></li>
          <li class="numeric">Max. value: <code>100</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>The battery state of health percentage. Values must be greater than zero and have at most one decimal place.</p>
      </td>
      <td class="propExample"><p><code>92.5</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-batterypayload-warrantymileage"><p>warrantyMileage</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>1</code></li>
          <li class="numeric">Max. value: <code>999999</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>The battery warranty mileage, in kilometers.</p>
      </td>
      <td class="propExample"><p><code>160000</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-batterypayload-warrantyperiod"><p>warrantyPeriod</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>1</code></li>
          <li class="numeric">Max. value: <code>99</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>The battery warranty period, in years.</p>
      </td>
      <td class="propExample"><p><code>8</code></p></td>
    </tr>

  </tbody>
</table>


## Channel
<table>
  <tbody>
    <tr>
      <th>Field name</th>
      <th>Type</th><th>Mandatory</th> <th>Other constraints</th>
      <th>Description</th>
      <th>Example</th>
    </tr>    <tr>
      <td class="propName" id="data-models-property-channel-id"><p>id</p></td>
      <td class="propType"><p><a href="#/data-models?id=channelid">ChannelId</a></p></td><td class="propMandatory"><p>Yes</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>The identifier of the channel</p>
      </td>
      <td class="propExample"><p></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-channel-url"><p>url</p></td>
      <td class="propType"><p>url</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>The URL where the listing is visible for the given channel</p>
      </td>
      <td class="propExample"><p><code>https://www.autoscout24.de/angebote/bmw-118-cf04da2d-9c57-4758-8735-5257e4eb1cae</code></p></td>
    </tr>

  </tbody>
</table>


## ChannelId
<table>
  <tbody>
    <tr>
      <th>Field name</th>
      <th>Type</th><th>Mandatory</th> <th>Other constraints</th>
      <th>Description</th>
      <th>Example</th>
    </tr>    <tr>
      <td class="propName" id="data-models-property-channelid--"><p>-</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li>Allowed values are: <code>AS24</code>, <code>AS24Dealer</code>, <code>AutoTrack</code>, <code>AutoTrackShared</code>, <code>AutoTrackOnly</code>, <code>mobile_de</code>, <code>autoproff</code>, <code>autoproff_marketplace_public</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>The id of a publication channel.</p>
        <p><code>AS24Dealer</code> means that the vehicle is visible on AutoScout24’s dealer specific platform.</p>
        <p><code>AS24</code> means that the vehicle is visible on AutoScout24’s general platform. Bear in mind this is a superset of ‘AS24Dealer’.</p>
        <p><code>AutoTrack</code> means that the vehicle is published on AutoTrack in the Netherlands and displayed on both platforms.</p>
        <p><code>AutoTrackShared</code> means that the vehicle is an existing shared listing displayed on both platforms.</p>
        <p><code>AutoTrackOnly</code> means that the vehicle is displayed only on AutoTrack.</p>
        <p><code>mobile_de</code> means that the vehicle is visible on <code>mobile_de</code> platform. This is not available for all customers yet, contact customer care to learn more.</p>
        <p><code>autoproff</code> indicates exporting this vehicle to Autoproff without publishing it (can be used for Auctions). No effect if the customer has no B2B Marketplace Manual Transfer activation.</p>
        <p><code>autoproff_marketplace_public</code> indicates publishing this vehicle to the B2B marketplace. No effect if the customer has no B2B Marketplace Manual Transfer activation.</p>
        <p>At least one publication channel must have the value <code>AS24</code> or <code>AS24Dealer</code>, unless the listing is Autoproff-exclusive.</p>
      </td>
      <td class="propExample"><p><code>AS24</code></p></td>
    </tr>

  </tbody>
</table>


## ChannelReference
<table>
  <tbody>
    <tr>
      <th>Field name</th>
      <th>Type</th><th>Mandatory</th> <th>Other constraints</th>
      <th>Description</th>
      <th>Example</th>
    </tr>    <tr>
      <td class="propName" id="data-models-property-channelreference-id"><p>id</p></td>
      <td class="propType"><p><a href="#/data-models?id=channelid">ChannelId</a></p></td><td class="propMandatory"><p>Yes</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>The identifier of the channel</p>
      </td>
      <td class="propExample"><p></p></td>
    </tr>

  </tbody>
</table>


## Co2Costs
<table>
  <tbody>
    <tr>
      <th>Field name</th>
      <th>Type</th><th>Mandatory</th> <th>Other constraints</th>
      <th>Description</th>
      <th>Example</th>
    </tr>    <tr>
      <td class="propName" id="data-models-property-co2costs-average"><p>average</p></td>
      <td class="propType"><p><a href="#/data-models?id=co2price">Co2Price</a></p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>The average CO2 costs.</p>
      </td>
      <td class="propExample"><p></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-co2costs-high"><p>high</p></td>
      <td class="propType"><p><a href="#/data-models?id=co2price">Co2Price</a></p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>The high CO2 costs.</p>
      </td>
      <td class="propExample"><p></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-co2costs-low"><p>low</p></td>
      <td class="propType"><p><a href="#/data-models?id=co2price">Co2Price</a></p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>The low CO2 costs.</p>
      </td>
      <td class="propExample"><p></p></td>
    </tr>

  </tbody>
</table>


## Co2Price
<table>
  <tbody>
    <tr>
      <th>Field name</th>
      <th>Type</th><th>Mandatory</th> <th>Other constraints</th>
      <th>Description</th>
      <th>Example</th>
    </tr>    <tr>
      <td class="propName" id="data-models-property-co2price-accumulated"><p>accumulated</p></td>
      <td class="propType"><p>number</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>0</code></li>
          <li class="numeric">Max. value: <code>100000</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>The accumulated CO2 price. </p>
      </td>
      <td class="propExample"><p><code>80.4</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-co2price-baseprice"><p>basePrice</p></td>
      <td class="propType"><p>number</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>0</code></li>
          <li class="numeric">Max. value: <code>100000</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>The base CO2 price.</p>
      </td>
      <td class="propExample"><p><code>80.4</code></p></td>
    </tr>

  </tbody>
</table>


## CompetitorVehicle
<table>
  <tbody>
    <tr>
      <th>Field name</th>
      <th>Type</th><th>Mandatory</th> <th>Other constraints</th>
      <th>Description</th>
      <th>Example</th>
    </tr>    <tr>
      <td class="propName" id="data-models-property-competitorvehicle-price"><p>price</p></td>
      <td class="propType"><p>number</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Price of the competitor listing. May be absent if the competitor listing has no price.</p>
      </td>
      <td class="propExample"><p><code>10000</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-competitorvehicle-url"><p>url</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>Yes</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>URL to the competitor listing detail page.</p>
      </td>
      <td class="propExample"><p><code>https://www.autoscout24.de/angebote/-comp1</code></p></td>
    </tr>

  </tbody>
</table>


## Condition
<table>
  <tbody>
    <tr>
      <th>Field name</th>
      <th>Type</th><th>Mandatory</th> <th>Other constraints</th>
      <th>Description</th>
      <th>Example</th>
    </tr>    <tr>
      <td class="propName" id="data-models-property-condition-description"><p>description</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Detailed description of the condition.</p>
      </td>
      <td class="propExample"><p><code>This car is **great**. \ It has no accidents: \ * not damaged \ * not painted
</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-condition-hadaccident"><p>hadAccident</p></td>
      <td class="propType"><p>boolean</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Should be set to true if the vehicle has had an accident in the past, irrespective of whether the vehicle has been repaired, or is currently roadworthy.</p>
      </td>
      <td class="propExample"><p><code>true</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-condition-hasrepaireddamages"><p>hasRepairedDamages</p></td>
      <td class="propType"><p>boolean</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Whether it has damages that are repaired.</p>
      </td>
      <td class="propExample"><p><code>true</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-condition-iscabinclean"><p>isCabinClean</p></td>
      <td class="propType"><p>boolean</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li>Forbidden for vehicleType <code>C</code> (car), <code>B</code> (bike), <code>N</code> (caravan/mobile home), <code>L</code> (trailer), <code>O</code> (boat), <code>W</code> (personal watercraft), <code>S</code> (snowmobile)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Indicates if the cabin is clean.</p>
      </td>
      <td class="propExample"><p><code>true</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-condition-iscurrentlydamaged"><p>isCurrentlyDamaged</p></td>
      <td class="propType"><p>boolean</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li>This attribute is only available for the German market. Its value won't be considered valid and won't be displayed in the AutoScout24 websites from other countries.</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Should be set to true if the vehicle is currently damaged.</p>
      </td>
      <td class="propExample"><p><code>true</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-condition-isroadworthy"><p>isRoadworthy</p></td>
      <td class="propType"><p>boolean</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li>This attribute is only available for the German market. Its value won't be considered valid and won't be displayed in the AutoScout24 websites from other countries.</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Should be set to true if the vehicle is fit for use on the road.</p>
      </td>
      <td class="propExample"><p><code>true</code></p></td>
    </tr>

  </tbody>
</table>


## Consumption
<table>
  <tbody>
    <tr>
      <th>Field name</th>
      <th>Type</th><th>Mandatory</th> <th>Other constraints</th>
      <th>Description</th>
      <th>Example</th>
    </tr>    <tr>
      <td class="propName" id="data-models-property-consumption-combined"><p>combined</p></td>
      <td class="propType"><p>number</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>0.1</code></li>
          <li class="numeric">Max. value: <code>99.9</code></li>
          <li>Mandatory for German dealers when the vehicle type is <code>C</code> (Car), the primary fuel type is not <code>12</code> (Electricity) and the car is considered new (<code>mileage</code> <= 1000 and <code>firstRegistrationDate</code> <= 8 months).</li>
          <li>Forbidden for vehicleType <code>L</code> (trailer)</li>
          <li>Forbidden for German dealers when the vehicle type is <code>C</code> (Car) or <code>X</code> (Light Commercial Vehicle) and primary fuel type <code>12</code> (Electricity).</li>
          <li>However, when both fields <code>primaryFuelType</code> and <code>additionalFuelTypes</code> are set, then both <code>combined</code> and <code>electricCombined</code> are allowed.</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Vehicle’s combined fuel consumption. l/100 km for petrol and diesel vehicles, kg/100km for compressed natural gas and hydrogen vehicles.</p>
      </td>
      <td class="propExample"><p><code>6.3</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-consumption-electriccombined"><p>electricCombined</p></td>
      <td class="propType"><p>number</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>0.1</code></li>
          <li class="numeric">Max. value: <code>99.9</code></li>
          <li>*Deprecated, use <code>wltp.consumptionElectricCombined</code> or <code>wltp.consumptionElectricCombinedWeighted</code> instead*</li>
          <li>Mandatory for German dealers when the vehicle type is <code>C</code> (Car), the primary fuel type is <code>12</code> (Electricity) and the car is considered new (<code>mileage</code> <= 1000 and <code>firstRegistrationDate</code> <= 8 months).</li>
          <li>Forbidden for vehicleType <code>L</code> (trailer)</li>
          <li>Forbidden for German dealers when vehicle type <code>C</code> (Car) or <code>X</code> (Light Commercial Vehicle) and primary fuel type different than <code>12</code> (Electricity).</li>
          <li>However, when both fields <code>primaryFuelType</code> and <code>additionalFuelTypes</code> are set, then both <code>combined</code> and <code>electricCombined</code> are allowed.</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Electric vehicle’s combined power consumption in kWh/100 km.</p>
      </td>
      <td class="propExample"><p><code>6.6</code></p></td>
    </tr>

  </tbody>
</table>


## CostModel
<table>
  <tbody>
    <tr>
      <th>Field name</th>
      <th>Type</th><th>Mandatory</th> <th>Other constraints</th>
      <th>Description</th>
      <th>Example</th>
    </tr>    <tr>
      <td class="propName" id="data-models-property-costmodel-co2costs"><p>co2Costs</p></td>
      <td class="propType"><p>object</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>The CO2 costs.</p>
      </td>
      <td class="propExample"><p><code>{
  "low" : {
    "basePrice" : 80.4,
    "accumulated" : 80.4
  },
  "average" : {
    "basePrice" : 80.4,
    "accumulated" : 80.4
  },
  "high" : {
    "basePrice" : 80.4,
    "accumulated" : 80.4
  }
}</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-costmodel-consumptioncosts"><p>consumptionCosts</p></td>
      <td class="propType"><p>number</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>0.1</code></li>
          <li class="numeric">Max. value: <code>10000</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Energy costs for an annual mileage of 15,000 km in EUR/year.</p>
      </td>
      <td class="propExample"><p><code>80.4</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-costmodel-consumptioncostsunit"><p>consumptionCostsUnit</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Unit used for consumptionCosts field</p>
      </td>
      <td class="propExample"><p><code>EUR/year</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-costmodel-consumptioncostsyear"><p>consumptionCostsYear</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Year of consumptionCosts.</p>
      </td>
      <td class="propExample"><p><code>2024</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-costmodel-energyprice"><p>energyPrice</p></td>
      <td class="propType"><p>number</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>0.1</code></li>
          <li class="numeric">Max. value: <code>10000</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>The price of electric energy in EUR/kWh.</p>
      </td>
      <td class="propExample"><p><code>0.804</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-costmodel-energypriceunit"><p>energyPriceUnit</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Unit used for energyPrice field</p>
      </td>
      <td class="propExample"><p><code>EUR/kWh</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-costmodel-fuelprice"><p>fuelPrice</p></td>
      <td class="propType"><p>number</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>0.1</code></li>
          <li class="numeric">Max. value: <code>10000</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>The fuel price in EUR/l (Benzin, Diesel, LPG) or EUR/kg (CNG, H2).</p>
      </td>
      <td class="propExample"><p><code>80.4</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-costmodel-fuelpriceunit"><p>fuelPriceUnit</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Unit used for fuelPrice field</p>
      </td>
      <td class="propExample"><p><code>EUR/l</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-costmodel-timeframe"><p>timeFrame</p></td>
      <td class="propType"><p>object</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>The time frame for the tax estimation.</p>
      </td>
      <td class="propExample"><p><code>start: 2024
end: 2024
</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-costmodel-vehicletax"><p>vehicleTax</p></td>
      <td class="propType"><p>number</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>0.1</code></li>
          <li class="numeric">Max. value: <code>10000</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>The vehicle tax.</p>
      </td>
      <td class="propExample"><p><code>223.4</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-costmodel-vehicletaxunit"><p>vehicleTaxUnit</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Unit used for vehicleTax field</p>
      </td>
      <td class="propExample"><p><code>EUR/year</code></p></td>
    </tr>

  </tbody>
</table>


## CostModelCommon
<table>
  <tbody>
    <tr>
      <th>Field name</th>
      <th>Type</th><th>Mandatory</th> <th>Other constraints</th>
      <th>Description</th>
      <th>Example</th>
    </tr>    <tr>
      <td class="propName" id="data-models-property-costmodelcommon-co2costs"><p>co2Costs</p></td>
      <td class="propType"><p>object</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>The CO2 costs.</p>
      </td>
      <td class="propExample"><p><code>{
  "low" : {
    "basePrice" : 80.4,
    "accumulated" : 80.4
  },
  "average" : {
    "basePrice" : 80.4,
    "accumulated" : 80.4
  },
  "high" : {
    "basePrice" : 80.4,
    "accumulated" : 80.4
  }
}</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-costmodelcommon-consumptioncosts"><p>consumptionCosts</p></td>
      <td class="propType"><p>number</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>0.1</code></li>
          <li class="numeric">Max. value: <code>10000</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Energy costs for an annual mileage of 15,000 km in EUR/year.</p>
      </td>
      <td class="propExample"><p><code>80.4</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-costmodelcommon-consumptioncostsyear"><p>consumptionCostsYear</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Year of consumptionCosts.</p>
      </td>
      <td class="propExample"><p><code>2024</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-costmodelcommon-energyprice"><p>energyPrice</p></td>
      <td class="propType"><p>number</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>0.1</code></li>
          <li class="numeric">Max. value: <code>10000</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>The price of electric energy in EUR/kWh.</p>
      </td>
      <td class="propExample"><p><code>0.804</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-costmodelcommon-fuelprice"><p>fuelPrice</p></td>
      <td class="propType"><p>number</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>0.1</code></li>
          <li class="numeric">Max. value: <code>10000</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>The fuel price in EUR/l (Benzin, Diesel, LPG) or EUR/kg (CNG, H2).</p>
      </td>
      <td class="propExample"><p><code>80.4</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-costmodelcommon-timeframe"><p>timeFrame</p></td>
      <td class="propType"><p>object</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>The time frame for the tax estimation.</p>
      </td>
      <td class="propExample"><p><code>start: 2024
end: 2024
</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-costmodelcommon-vehicletax"><p>vehicleTax</p></td>
      <td class="propType"><p>number</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>0.1</code></li>
          <li class="numeric">Max. value: <code>10000</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>The vehicle tax.</p>
      </td>
      <td class="propExample"><p><code>223.4</code></p></td>
    </tr>

  </tbody>
</table>


## CostModelPayload
<table>
  <tbody>
    <tr>
      <th>Field name</th>
      <th>Type</th><th>Mandatory</th> <th>Other constraints</th>
      <th>Description</th>
      <th>Example</th>
    </tr>    <tr>
      <td class="propName" id="data-models-property-costmodelpayload-co2costs"><p>co2Costs</p></td>
      <td class="propType"><p>object</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>The CO2 costs.</p>
      </td>
      <td class="propExample"><p><code>{
  "low" : {
    "basePrice" : 80.4,
    "accumulated" : 80.4
  },
  "average" : {
    "basePrice" : 80.4,
    "accumulated" : 80.4
  },
  "high" : {
    "basePrice" : 80.4,
    "accumulated" : 80.4
  }
}</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-costmodelpayload-consumptioncosts"><p>consumptionCosts</p></td>
      <td class="propType"><p>number</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>0.1</code></li>
          <li class="numeric">Max. value: <code>10000</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Energy costs for an annual mileage of 15,000 km in EUR/year.</p>
      </td>
      <td class="propExample"><p><code>80.4</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-costmodelpayload-consumptioncostsyear"><p>consumptionCostsYear</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Year of consumptionCosts.</p>
      </td>
      <td class="propExample"><p><code>2024</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-costmodelpayload-energyprice"><p>energyPrice</p></td>
      <td class="propType"><p>number</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>0.1</code></li>
          <li class="numeric">Max. value: <code>10000</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>The price of electric energy in EUR/kWh.</p>
      </td>
      <td class="propExample"><p><code>0.804</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-costmodelpayload-fuelprice"><p>fuelPrice</p></td>
      <td class="propType"><p>number</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>0.1</code></li>
          <li class="numeric">Max. value: <code>10000</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>The fuel price in EUR/l (Benzin, Diesel, LPG) or EUR/kg (CNG, H2).</p>
      </td>
      <td class="propExample"><p><code>80.4</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-costmodelpayload-timeframe"><p>timeFrame</p></td>
      <td class="propType"><p>object</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>The time frame for the tax estimation.</p>
      </td>
      <td class="propExample"><p><code>start: 2024
end: 2024
</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-costmodelpayload-vehicletax"><p>vehicleTax</p></td>
      <td class="propType"><p>number</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>0.1</code></li>
          <li class="numeric">Max. value: <code>10000</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>The vehicle tax.</p>
      </td>
      <td class="propExample"><p><code>223.4</code></p></td>
    </tr>

  </tbody>
</table>


## CostModelUnits
<table>
  <tbody>
    <tr>
      <th>Field name</th>
      <th>Type</th><th>Mandatory</th> <th>Other constraints</th>
      <th>Description</th>
      <th>Example</th>
    </tr>    <tr>
      <td class="propName" id="data-models-property-costmodelunits-consumptioncostsunit"><p>consumptionCostsUnit</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Unit used for consumptionCosts field</p>
      </td>
      <td class="propExample"><p><code>EUR/year</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-costmodelunits-energypriceunit"><p>energyPriceUnit</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Unit used for energyPrice field</p>
      </td>
      <td class="propExample"><p><code>EUR/kWh</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-costmodelunits-fuelpriceunit"><p>fuelPriceUnit</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Unit used for fuelPrice field</p>
      </td>
      <td class="propExample"><p><code>EUR/l</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-costmodelunits-vehicletaxunit"><p>vehicleTaxUnit</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Unit used for vehicleTax field</p>
      </td>
      <td class="propExample"><p><code>EUR/year</code></p></td>
    </tr>

  </tbody>
</table>


## Culture
<table>
  <tbody>
    <tr>
      <th>Field name</th>
      <th>Type</th><th>Mandatory</th> <th>Other constraints</th>
      <th>Description</th>
      <th>Example</th>
    </tr>    <tr>
      <td class="propName" id="data-models-property-culture--"><p>-</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li>Allowed values are: <code>de-DE</code>, <code>de-AT</code>, <code>nl-BE</code>, <code>fr-BE</code>, <code>fr-FR</code>, <code>it-IT</code>, <code>es-ES</code>, <code>fr-LU</code>, <code>en-GB</code>, <code>nl-NL</code>, <code>fr-CA</code>, <code>en-CA</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>A combination of country and language in which AutoScout24 offers their service, encoded as a locale.</p>
        <p>The AutoScout24.com domain is offered in English and is represented by the culture <code>en-GB</code></p>
      </td>
      <td class="propExample"><p><code>de-DE</code></p></td>
    </tr>

  </tbody>
</table>


## Customer
<table>
  <tbody>
    <tr>
      <th>Field name</th>
      <th>Type</th><th>Mandatory</th> <th>Other constraints</th>
      <th>Description</th>
      <th>Example</th>
    </tr>    <tr>
      <td class="propName" id="data-models-property-customer-cansetmiarequestedtier"><p>canSetMiaRequestedTier</p></td>
      <td class="propType"><p>boolean</p></td><td class="propMandatory"><p>Yes</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>If a customer has a contract to use the manualTier feature.</p>
        <p>See MiaPayload section for more information about this feature.</p>
      </td>
      <td class="propExample"><p><code>true</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-customer-canusesellonline"><p>canUseSellOnline</p></td>
      <td class="propType"><p>boolean</p></td><td class="propMandatory"><p>Yes</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>If a customer has a contract to use the sellOnline feature.</p>
        <p><strong>:construction: This functionality is currently under construction and will not be shown to Autoscout24 users</strong></p>
      </td>
      <td class="propExample"><p><code>true</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-customer-companyname"><p>companyName</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Customer company name from the AutoScout24 CRM system.</p>
      </td>
      <td class="propExample"><p><code>ATEST Motors LT</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-customer-configuration"><p>configuration</p></td>
      <td class="propType"><p><a href="#/data-models?id=customerconfiguration">CustomerConfiguration</a></p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Configuration options for the customer including package and product settings.</p>
        <p>This field is only included when the customer has a package or enabled AutoProff marketplace configuration.</p>
      </td>
      <td class="propExample"><p></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-customer-externalid"><p>externalId</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>An optional String ID that can be set by customer care to identify the dealer across systems.</p>
      </td>
      <td class="propExample"><p><code>1085</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-customer-id"><p>id</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>Yes</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>The unique identifier of this customer used throughout the API</p>
      </td>
      <td class="propExample"><p><code>2142082683</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-customer-sellid"><p>sellId</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Customer identification number (Sell-ID) from the AutoScout24 CRM system, which is also printed on official dealer invoice/communication documents.</p>
        <p>Note: only the id can be used to make requests.</p>
      </td>
      <td class="propExample"><p><code>892611</code></p></td>
    </tr>

  </tbody>
</table>


## CustomerConfiguration
<table>
  <tbody>
    <tr>
      <th>Field name</th>
      <th>Type</th><th>Mandatory</th> <th>Other constraints</th>
      <th>Description</th>
      <th>Example</th>
    </tr>    <tr>
      <td class="propName" id="data-models-property-customerconfiguration-package"><p>package</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>The customer's tiered pricing package (e.g., SMART, PREMIUM)</p>
      </td>
      <td class="propExample"><p><code>SMART</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-customerconfiguration-products"><p>products</p></td>
      <td class="propType"><p><a href="#/data-models?id=productsconfiguration">ProductsConfiguration</a></p></td><td class="propMandatory"><p>Yes</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Product-specific configuration for the customer</p>
      </td>
      <td class="propExample"><p></p></td>
    </tr>

  </tbody>
</table>


## CustomerSeals
<table>
  <tbody>
    <tr>
      <th>Field name</th>
      <th>Type</th><th>Mandatory</th> <th>Other constraints</th>
      <th>Description</th>
      <th>Example</th>
    </tr>    <tr>
      <td class="propName" id="data-models-property-customerseals-sealsid"><p>sealsId</p></td>
      <td class="propType"><p>array[integer]</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li>Items must be unique</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>List of seals</p>
      </td>
      <td class="propExample"><p></p></td>
    </tr>

  </tbody>
</table>


## Customers
<table>
  <tbody>
    <tr>
      <th>Field name</th>
      <th>Type</th><th>Mandatory</th> <th>Other constraints</th>
      <th>Description</th>
      <th>Example</th>
    </tr>    <tr>
      <td class="propName" id="data-models-property-customers-customers"><p>customers</p></td>
      <td class="propType"><p>array[<a href="#/data-models?id=customer">Customer</a>]</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>a list of customers</p>
      </td>
      <td class="propExample"><p></p></td>
    </tr>

  </tbody>
</table>


## DealerPrice
<table>
  <tbody>
    <tr>
      <th>Field name</th>
      <th>Type</th><th>Mandatory</th> <th>Other constraints</th>
      <th>Description</th>
      <th>Example</th>
    </tr>    <tr>
      <td class="propName" id="data-models-property-dealerprice-currency"><p>currency</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>Yes</p></td>      <td class="propConstraints">
        <ul>
          <li>Allowed values are: <code>EUR</code>, <code>CAD</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Currency for given price. Validated against values allowed for the Dealer Marketplace.</p>
      </td>
      <td class="propExample"><p><code>EUR</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-dealerprice-netprice"><p>netPrice</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>1</code></li>
          <li>Must be less than <code>price</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Net price for the vehicle</p>
      </td>
      <td class="propExample"><p><code>15300</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-dealerprice-price"><p>price</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>Yes</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>1</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Gross price for the vehicle</p>
      </td>
      <td class="propExample"><p><code>16500</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-dealerprice-vatrate"><p>vatRate</p></td>
      <td class="propType"><p>number</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>0</code></li>
          <li class="numeric">Max. value: <code>100</code></li>
          <li>Only 1 decimal is accepted. If more decimals are sent they will be truncated.</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>The value added tax rate.</p>
      </td>
      <td class="propExample"><p><code>17</code></p></td>
    </tr>

  </tbody>
</table>


## Discount
<table>
  <tbody>
    <tr>
      <th>Field name</th>
      <th>Type</th><th>Mandatory</th> <th>Other constraints</th>
      <th>Description</th>
      <th>Example</th>
    </tr>    <tr>
      <td class="propName" id="data-models-property-discount-fixedamount"><p>fixedAmount</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>Yes</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>An amount to be discounted</p>
      </td>
      <td class="propExample"><p><code>500</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-discount-pricealreadydiscounted"><p>priceAlreadyDiscounted</p></td>
      <td class="propType"><p>boolean</p></td><td class="propMandatory"><p>Yes</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Indicates whether a discount is already included in a price / monthly rate.</p>
      </td>
      <td class="propExample"><p><code>false</code></p></td>
    </tr>

  </tbody>
</table>


## Error
<table>
  <tbody>
    <tr>
      <th>Field name</th>
      <th>Type</th><th>Mandatory</th> <th>Other constraints</th>
      <th>Description</th>
      <th>Example</th>
    </tr>    <tr>
      <td class="propName" id="data-models-property-error-code"><p>code</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li>Allowed values are: <code>address-is-required</code>, <code>attribute-contains-prohibited-content</code>, <code>attribute-is-zero-or-negative</code>, <code>batch-id-is-invalid</code>, <code>cannot-partially-update-listing</code>, <code>city-is-required</code>, <code>content-type-not-provided</code>, <code>country-code-is-not-supported</code>, <code>customer-not-found-error</code>, <code>duplicated-image</code>, <code>empty-body</code>, <code>empty-three-sixty-images-collection</code>, <code>first-registration-date-too-modern</code>, <code>first-registration-date-too-old</code>, <code>forbidden-attribute-present</code>, <code>forbidden-leasing-offer-attribute-present</code>, <code>image-does-not-exist</code>, <code>image-not-readable</code>, <code>image-with-invalid-content-type</code>, <code>images-not-found</code>, <code>invalid-additional-supported-fuel-types</code>, <code>invalid-area-code-in-phone-number</code>, <code>invalid-availability</code>, <code>invalid-auxiliary-power</code>, <code>invalid-belgian-carpass-mileage-url</code>, <code>invalid-bidirectional-charging-types</code>, <code>invalid-body-color</code>, <code>invalid-body-type</code>, <code>invalid-body-type-when-has-no-engine</code>, <code>invalid-brake-type</code>, <code>invalid-co-2-class</code>, <code>invalid-co-2-class-discharged</code>, <code>invalid-chassis-bed-length</code>, <code>invalid-condition-data</code>, <code>invalid-content-type</code>, <code>invalid-country-version</code>, <code>invalid-decimal-scale</code>, <code>invalid-debit-interest-type</code>, <code>invalid-dial-country-code-in-phone-number</code>, <code>invalid-drivetrain</code>, <code>invalid-efficiency-class</code>, <code>invalid-engine-cooling-system</code>, <code>invalid-engine-mounting-type</code>, <code>invalid-equipment</code>, <code>invalid-eu-emission-standard</code>, <code>invalid-exterior-material</code>, <code>invalid-field-length</code>, <code>invalid-financing-type</code>, <code>invalid-flooring-material</code>, <code>invalid-fridge-power-type</code>, <code>invalid-fuel-category</code>, <code>invalid-fuel-delivery-type</code>, <code>invalid-fuel-type-or-category-for-plugin-hybrid</code>, <code>invalid-german-emissions-sticker</code>, <code>invalid-has-warranty-type</code>, <code>invalid-hull-material</code>, <code>invalid-included-services</code>, <code>invalid-json</code>, <code>invalid-leasing-offer-country</code>, <code>invalid-listing-payload</code>, <code>invalid-make</code>, <code>invalid-make-with-replacement</code>, <code>invalid-mileage</code>, <code>invalid-model</code>, <code>invalid-model-with-replacement</code>, <code>invalid-model-version</code>, <code>invalid-next-inspection-date</code>, <code>invalid-offer-type</code>, <code>invalid-phone-number</code>, <code>invalid-previous-owners-count</code>, <code>invalid-price-currency</code>, <code>invalid-price-value</code>, <code>invalid-primary-fuel-type</code>, <code>invalid-publication-status</code>, <code>invalid-reference</code>, <code>invalid-references</code>, <code>invalid-requested-seals</code>, <code>invalid-requested-tier</code>, <code>invalid-steering-type</code>, <code>invalid-test-mode</code>, <code>invalid-transmission</code>, <code>invalid-twinner-key</code>, <code>invalid-upholstery-color</code>, <code>invalid-upholstery-type</code>, <code>invalid-uuid</code>, <code>invalid-vehicle-type</code>, <code>invalid-year-range</code>, <code>invalid-you-tube-video-url</code>, <code>json-not-found</code>, <code>last-cam-belt-service-cannot-be-in-the-future</code>, <code>listing-creation-limit-exceeded</code>, <code>listing-does-not-exist</code>, <code>listing-does-not-exist-or-has-overwrite-protection</code>, <code>listing-on-hold-cannot-be-updated</code>, <code>listings-do-not-exist</code>, <code>mandatory-attribute-missing</code>, <code>maximum-image-resolution-exceeded</code>, <code>maximum-image-size-exceeded</code>, <code>maximum-value-exceeded</code>, <code>maximum-value-exceeded-emission-consumption</code>, <code>minimum-image-resolution-not-met</code>, <code>minimum-value-exceeded</code>, <code>minimum-value-exceeded-emission-consumption</code>, <code>missing-belgian-carpass-mileage-url</code>, <code>phone-number-requires-address</code>, <code>publication-not-contains-as24-or-as24-dealer-channel</code>, <code>invalid-publication-channel</code>, <code>publication-channels-not-allowed</code>, <code>quoka-listing-requires-address</code>, <code>service-under-maintenance</code>, <code>standard-image-does-not-support-vr-format</code>, <code>three-sixty-images-collection-too-few-images</code>, <code>three-sixty-images-collection-too-many-images</code>, <code>three-sixty-vr-unsupported-format</code>, <code>too-many-highlights</code>, <code>too-many-images</code>, <code>unsupported-image-type</code>, <code>upload-360-image-failed</code>, <code>upload-image-failed</code>, <code>wltp-and-nedc-set-error</code>, <code>wltp-attribute-forbidden-for-engine-type</code>, <code>wltp-attribute-required-for-engine-type</code>, <code>wltp-co-2-emissions-combined-for-evs-invalid</code>, <code>wltp-test-mode-only-error</code>, <code>zip-code-is-required</code>, <code>invalid-internal-status</code>, <code>vehicle-does-not-exist</code>, <code>unexpected-price-evaluation-error</code>, <code>vin-already-exists</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>The type of error that occurred when trying to execute the request</p>
      </td>
      <td class="propExample"><p><code>empty-body</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-error-message"><p>message</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>A detailed explanation of the error</p>
      </td>
      <td class="propExample"><p><code>The property 'prices' could not be found
</code></p></td>
    </tr>

  </tbody>
</table>


## ErrorCulture
<table>
  <tbody>
    <tr>
      <th>Field name</th>
      <th>Type</th><th>Mandatory</th> <th>Other constraints</th>
      <th>Description</th>
      <th>Example</th>
    </tr>    <tr>
      <td class="propName" id="data-models-property-errorculture--"><p>-</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li>Allowed values are: <code>de-DE</code>, <code>de-AT</code>, <code>it-IT</code>, <code>en-GB</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Supported cultures for translating validation error messages.</p>
      </td>
      <td class="propExample"><p><code>de-DE</code></p></td>
    </tr>

  </tbody>
</table>


## Errors
<table>
  <tbody>
    <tr>
      <th>Field name</th>
      <th>Type</th><th>Mandatory</th> <th>Other constraints</th>
      <th>Description</th>
      <th>Example</th>
    </tr>    <tr>
      <td class="propName" id="data-models-property-errors-errors"><p>errors</p></td>
      <td class="propType"><p>array[<a href="#/data-models?id=error">Error</a>]</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>A list of errors that occured when trying to execute the request</p>
      </td>
      <td class="propExample"><p></p></td>
    </tr>

  </tbody>
</table>


## ExclusiveOffer
<table>
  <tbody>
    <tr>
      <th>Field name</th>
      <th>Type</th><th>Mandatory</th> <th>Other constraints</th>
      <th>Description</th>
      <th>Example</th>
    </tr>    <tr>
      <td class="propName" id="data-models-property-exclusiveoffer-description"><p>description</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Max. length: <code>300</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>A description about the exclusive offer</p>
        <p><strong>🚧 This functionality is currently under construction and will not be shown to Autoscout24 users</strong></p>
      </td>
      <td class="propExample"><p><code>10% off for the first 10 days.</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-exclusiveoffer-enddate"><p>endDate</p></td>
      <td class="propType"><p>date</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>A date by which the exclusive offer expires.</p>
        <p><strong>🚧 This functionality is currently under construction and will not be shown to Autoscout24 users</strong></p>
      </td>
      <td class="propExample"><p><code>2020-09-10</code></p></td>
    </tr>

  </tbody>
</table>


## ExclusiveOfferPayload
<table>
  <tbody>
    <tr>
      <th>Field name</th>
      <th>Type</th><th>Mandatory</th> <th>Other constraints</th>
      <th>Description</th>
      <th>Example</th>
    </tr>    <tr>
      <td class="propName" id="data-models-property-exclusiveofferpayload-description"><p>description</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>Yes</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Max. length: <code>300</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>A description about the exclusive offer</p>
        <p><strong>🚧 This functionality is currently under construction and will not be shown to Autoscout24 users</strong></p>
      </td>
      <td class="propExample"><p><code>10% off for the first 10 days.</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-exclusiveofferpayload-enddate"><p>endDate</p></td>
      <td class="propType"><p>date</p></td><td class="propMandatory"><p>Yes</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>A date by which the exclusive offer expires.</p>
        <p><strong>🚧 This functionality is currently under construction and will not be shown to Autoscout24 users</strong></p>
      </td>
      <td class="propExample"><p><code>2020-09-10</code></p></td>
    </tr>

  </tbody>
</table>


## FallbackAttributesInteger
<table>
  <tbody>
    <tr>
      <th>Field name</th>
      <th>Type</th><th>Mandatory</th> <th>Other constraints</th>
      <th>Description</th>
      <th>Example</th>
    </tr>    <tr>
      <td class="propName" id="data-models-property-fallbackattributesinteger-sourcetimestamp"><p>sourceTimestamp</p></td>
      <td class="propType"><p>date-time</p></td><td class="propMandatory"><p>Yes</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Datetime value for fallback attributes in ISO-8601 format.</p>
      </td>
      <td class="propExample"><p><code>2019-02-07T16:07:00.665267Z</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-fallbackattributesinteger-value"><p>value</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>Yes</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Integer value for fallback attributes.</p>
      </td>
      <td class="propExample"><p><code>1</code></p></td>
    </tr>

  </tbody>
</table>


## FinancingOffer
<table>
  <tbody>
    <tr>
      <th>Field name</th>
      <th>Type</th><th>Mandatory</th> <th>Other constraints</th>
      <th>Description</th>
      <th>Example</th>
    </tr>    <tr>
      <td class="propName" id="data-models-property-financingoffer-annualrate"><p>annualRate</p></td>
      <td class="propType"><p>number</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>0</code></li>
          <li class="numeric">Max. value: <code>99.99</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Annual rate in %.</p>
      </td>
      <td class="propExample"><p><code>10</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-financingoffer-annualrateunit"><p>annualRateUnit</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Unit used for annualRate field.</p>
      </td>
      <td class="propExample"><p><code>%</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-financingoffer-bank"><p>bank</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Max. length: <code>2000</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Name, legal form, address, postal code and city of bank as well as other financing offer conditions.</p>
        <p>Also indicate whether the financing offer requires the conclusion of an insurance contract or a contract for other supplementary benefits.</p>
        <p>If the cost of this contract cannot be determined in advance, indicate the obligation to conclude this contract</p>
        <p>(e.g. compulsory conclusion of a comprehensive insurance contract)</p>
      </td>
      <td class="propExample"><p><code>Mercedes-Benz Bank AG, Siemensstraße 7, 70469 Stuttgart</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-financingoffer-banksecondlanguage"><p>bankSecondLanguage</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Max. length: <code>2000</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Dealers using EDF (Exclusive Dealer Financing) in Belgium need to fill in an additional "Other Financing Conditions" field.</p>
        <p>Due to legal requirements, text needs to be displayed in French on FR-BE and in Dutch on NL-BE.</p>
        <p>In order to avoid financial consequences, both versions must be filled in.</p>
      </td>
      <td class="propExample"><p><code>FR version: Prêt à tempérament tous buts de 8.500 €, TAEG (Taux Annuel Effectif Global) de 5,99% (taux débiteur annuel fixe : 5,99%),
mensualité de 198,96 € pour une durée de crédit de 48 mois.
NL version: Lening op afbetaling van € 8.500, JKP (jaarlijks kostenpercentage) van 5,99% (vaste jaarlijkse debetrente: 5,99%),
maandelijkse aflossing van € 198,96 voor een looptijd van het krediet van 48 maanden.
</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-financingoffer-closingcosts"><p>closingCosts</p></td>
      <td class="propType"><p>number</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>0</code></li>
          <li class="numeric">Max. value: <code>999999.99</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>A fee for placing the loan contract.</p>
      </td>
      <td class="propExample"><p><code>250</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-financingoffer-currency"><p>currency</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li>Allowed values are: <code>EUR</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Currency for given financing offer fields.</p>
      </td>
      <td class="propExample"><p><code>EUR</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-financingoffer-debitinterestrate"><p>debitInterestRate</p></td>
      <td class="propType"><p>number</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>0</code></li>
          <li class="numeric">Max. value: <code>99.99</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Debit interest rate in %.</p>
      </td>
      <td class="propExample"><p><code>15</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-financingoffer-debitinterestrateunit"><p>debitInterestRateUnit</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Unit used for debitInterestRate field.</p>
      </td>
      <td class="propExample"><p><code>%</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-financingoffer-debitinteresttype"><p>debitInterestType</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li>Allowed values can be retrieved via the references API (reference type DebitInterestType).</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Debit interest type.</p>
      </td>
      <td class="propExample"><p><code>1</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-financingoffer-duration"><p>duration</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>1</code></li>
          <li class="numeric">Max. value: <code>999</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Duration of the loan contract in months.</p>
      </td>
      <td class="propExample"><p><code>3</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-financingoffer-durationunit"><p>durationUnit</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Unit used for duration field.</p>
      </td>
      <td class="propExample"><p><code>months</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-financingoffer-endingrate"><p>endingRate</p></td>
      <td class="propType"><p>number</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>0</code></li>
          <li class="numeric">Max. value: <code>999999.99</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Ending rate.</p>
      </td>
      <td class="propExample"><p><code>100</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-financingoffer-financingtype"><p>financingType</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li>Allowed values are: <code>C</code></li>
          <li>Meaning of the values: <code>C</code> (Credit)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Financing type.</p>
      </td>
      <td class="propExample"><p><code>C</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-financingoffer-grosscreditamount"><p>grossCreditAmount</p></td>
      <td class="propType"><p>number</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>0.01</code></li>
          <li class="numeric">Max. value: <code>999999999.99</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Gross credit amount in EUR.</p>
      </td>
      <td class="propExample"><p><code>1000</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-financingoffer-initialpayment"><p>initialPayment</p></td>
      <td class="propType"><p>number</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>0</code></li>
          <li class="numeric">Max. value: <code>999999.99</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Initial payment for the loan in EUR (if applicable).</p>
      </td>
      <td class="propExample"><p><code>5000</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-financingoffer-monthlyrate"><p>monthlyRate</p></td>
      <td class="propType"><p>number</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>0</code></li>
          <li class="numeric">Max. value: <code>999999.99</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Monthly rate in EUR.</p>
      </td>
      <td class="propExample"><p><code>200</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-financingoffer-netcreditamount"><p>netCreditAmount</p></td>
      <td class="propType"><p>number</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>0</code></li>
          <li class="numeric">Max. value: <code>999999999.99</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Net credit amount in EUR.</p>
      </td>
      <td class="propExample"><p><code>19999.9</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-financingoffer-paymentprotectioninsurance"><p>paymentProtectionInsurance</p></td>
      <td class="propType"><p>number</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>0</code></li>
          <li class="numeric">Max. value: <code>999999999.99</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Monthly payment protection insurance rate in EUR.</p>
      </td>
      <td class="propExample"><p><code>100</code></p></td>
    </tr>

  </tbody>
</table>


## FinancingOfferPayload
<table>
  <tbody>
    <tr>
      <th>Field name</th>
      <th>Type</th><th>Mandatory</th> <th>Other constraints</th>
      <th>Description</th>
      <th>Example</th>
    </tr>    <tr>
      <td class="propName" id="data-models-property-financingofferpayload-annualrate"><p>annualRate</p></td>
      <td class="propType"><p>number</p></td><td class="propMandatory"><p>Yes</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>0</code></li>
          <li class="numeric">Max. value: <code>99.99</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Annual rate in %.</p>
      </td>
      <td class="propExample"><p><code>10</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-financingofferpayload-bank"><p>bank</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>Yes</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Max. length: <code>2000</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Name, legal form, address, postal code and city of bank as well as other financing offer conditions.</p>
        <p>Also indicate whether the financing offer requires the conclusion of an insurance contract or a contract for other supplementary benefits.</p>
        <p>If the cost of this contract cannot be determined in advance, indicate the obligation to conclude this contract</p>
        <p>(e.g. compulsory conclusion of a comprehensive insurance contract)</p>
      </td>
      <td class="propExample"><p><code>Mercedes-Benz Bank AG, Siemensstraße 7, 70469 Stuttgart</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-financingofferpayload-banksecondlanguage"><p>bankSecondLanguage</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Max. length: <code>2000</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Dealers using EDF (Exclusive Dealer Financing) in Belgium need to fill in an additional "Other Financing Conditions" field.</p>
        <p>Due to legal requirements, text needs to be displayed in French on FR-BE and in Dutch on NL-BE.</p>
        <p>In order to avoid financial consequences, both versions must be filled in.</p>
      </td>
      <td class="propExample"><p><code>FR version: Prêt à tempérament tous buts de 8.500 €, TAEG (Taux Annuel Effectif Global) de 5,99% (taux débiteur annuel fixe : 5,99%),
mensualité de 198,96 € pour une durée de crédit de 48 mois.
NL version: Lening op afbetaling van € 8.500, JKP (jaarlijks kostenpercentage) van 5,99% (vaste jaarlijkse debetrente: 5,99%),
maandelijkse aflossing van € 198,96 voor een looptijd van het krediet van 48 maanden.
</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-financingofferpayload-closingcosts"><p>closingCosts</p></td>
      <td class="propType"><p>number</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>0</code></li>
          <li class="numeric">Max. value: <code>999999.99</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>A fee for placing the loan contract.</p>
      </td>
      <td class="propExample"><p><code>250</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-financingofferpayload-currency"><p>currency</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>Yes</p></td>      <td class="propConstraints">
        <ul>
          <li>Allowed values are: <code>EUR</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Currency for given financing offer fields.</p>
      </td>
      <td class="propExample"><p><code>EUR</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-financingofferpayload-debitinterestrate"><p>debitInterestRate</p></td>
      <td class="propType"><p>number</p></td><td class="propMandatory"><p>Yes</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>0</code></li>
          <li class="numeric">Max. value: <code>99.99</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Debit interest rate in %.</p>
      </td>
      <td class="propExample"><p><code>15</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-financingofferpayload-debitinteresttype"><p>debitInterestType</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>Yes</p></td>      <td class="propConstraints">
        <ul>
          <li>Allowed values can be retrieved via the references API (reference type DebitInterestType).</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Debit interest type.</p>
      </td>
      <td class="propExample"><p><code>1</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-financingofferpayload-duration"><p>duration</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>Yes</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>1</code></li>
          <li class="numeric">Max. value: <code>999</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Duration of the loan contract in months.</p>
      </td>
      <td class="propExample"><p><code>3</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-financingofferpayload-endingrate"><p>endingRate</p></td>
      <td class="propType"><p>number</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>0</code></li>
          <li class="numeric">Max. value: <code>999999.99</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Ending rate.</p>
      </td>
      <td class="propExample"><p><code>100</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-financingofferpayload-financingtype"><p>financingType</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>Yes</p></td>      <td class="propConstraints">
        <ul>
          <li>Allowed values are: <code>C</code></li>
          <li>Meaning of the values: <code>C</code> (Credit)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Financing type.</p>
      </td>
      <td class="propExample"><p><code>C</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-financingofferpayload-grosscreditamount"><p>grossCreditAmount</p></td>
      <td class="propType"><p>number</p></td><td class="propMandatory"><p>Yes</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>0.01</code></li>
          <li class="numeric">Max. value: <code>999999999.99</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Gross credit amount in EUR.</p>
      </td>
      <td class="propExample"><p><code>1000</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-financingofferpayload-initialpayment"><p>initialPayment</p></td>
      <td class="propType"><p>number</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>0</code></li>
          <li class="numeric">Max. value: <code>999999.99</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Initial payment for the loan in EUR (if applicable).</p>
      </td>
      <td class="propExample"><p><code>5000</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-financingofferpayload-monthlyrate"><p>monthlyRate</p></td>
      <td class="propType"><p>number</p></td><td class="propMandatory"><p>Yes</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>0</code></li>
          <li class="numeric">Max. value: <code>999999.99</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Monthly rate in EUR.</p>
      </td>
      <td class="propExample"><p><code>200</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-financingofferpayload-netcreditamount"><p>netCreditAmount</p></td>
      <td class="propType"><p>number</p></td><td class="propMandatory"><p>Yes</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>0</code></li>
          <li class="numeric">Max. value: <code>999999999.99</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Net credit amount in EUR.</p>
      </td>
      <td class="propExample"><p><code>19999.9</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-financingofferpayload-paymentprotectioninsurance"><p>paymentProtectionInsurance</p></td>
      <td class="propType"><p>number</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>0</code></li>
          <li class="numeric">Max. value: <code>999999999.99</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Monthly payment protection insurance rate in EUR.</p>
      </td>
      <td class="propExample"><p><code>100</code></p></td>
    </tr>

  </tbody>
</table>


## Highlight
<table>
  <tbody>
    <tr>
      <th>Field name</th>
      <th>Type</th><th>Mandatory</th> <th>Other constraints</th>
      <th>Description</th>
      <th>Example</th>
    </tr>    <tr>
      <td class="propName" id="data-models-property-highlight--"><p>-</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. length: <code>1</code></li>
          <li class="numeric">Max. length: <code>30</code></li>
          <li>URLs are forbidden in the content</li>
          <li>Emails are forbidden in the content</li>
          <li>Forbidden characters are<code>&lt;</code> or <code>&gt;</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>A short note highlighting a key feature of the vehicle</p>
      </td>
      <td class="propExample"><p><code>fully equipped</code></p></td>
    </tr>

  </tbody>
</table>


## Image
<table>
  <tbody>
    <tr>
      <th>Field name</th>
      <th>Type</th><th>Mandatory</th> <th>Other constraints</th>
      <th>Description</th>
      <th>Example</th>
    </tr>    <tr>
      <td class="propName" id="data-models-property-image-id"><p>id</p></td>
      <td class="propType"><p>guid</p></td><td class="propMandatory"><p>Yes</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>The image identifier</p>
      </td>
      <td class="propExample"><p><code>269e6ae5-a49b-4ea5-85a2-9c2093c26287</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-image-md5"><p>md5</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>The unique MD5 hash identifier for image</p>
      </td>
      <td class="propExample"><p><code>bb3da223907cbe437bab4cf2e7343d61</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-image-previewurl"><p>previewUrl</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>The URL of the image</p>
      </td>
      <td class="propExample"><p><code>https://prod.pictures.autoscout24.net/listing-images/d0b91f24-68c2-4683-b575-db510e97fc2d_e5079988-9e05-43f0-8cba-6f37e6f1de28.jpg</code></p></td>
    </tr>

  </tbody>
</table>


## ImageMd5
<table>
  <tbody>
    <tr>
      <th>Field name</th>
      <th>Type</th><th>Mandatory</th> <th>Other constraints</th>
      <th>Description</th>
      <th>Example</th>
    </tr>    <tr>
      <td class="propName" id="data-models-property-imagemd5-md5"><p>md5</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>The unique MD5 hash identifier for image</p>
      </td>
      <td class="propExample"><p><code>bb3da223907cbe437bab4cf2e7343d61</code></p></td>
    </tr>

  </tbody>
</table>


## ImagePayload
<table>
  <tbody>
    <tr>
      <th>Field name</th>
      <th>Type</th><th>Mandatory</th> <th>Other constraints</th>
      <th>Description</th>
      <th>Example</th>
    </tr>    <tr>
      <td class="propName" id="data-models-property-imagepayload-id"><p>id</p></td>
      <td class="propType"><p>guid</p></td><td class="propMandatory"><p>Yes</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>The identifier of the image to associate to the listing</p>
      </td>
      <td class="propExample"><p><code>269e6ae5-a49b-4ea5-85a2-9c2093c26287</code></p></td>
    </tr>

  </tbody>
</table>


## ImagePresignedUrl
<table>
  <tbody>
    <tr>
      <th>Field name</th>
      <th>Type</th><th>Mandatory</th> <th>Other constraints</th>
      <th>Description</th>
      <th>Example</th>
    </tr>    <tr>
      <td class="propName" id="data-models-property-imagepresignedurl-imagepresignedurl"><p>imagePresignedUrl</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>A pre-signed URL that allows you to grant temporary access to image for users who don't have permission to AWS S3 bucket.</p>
        <p>A pre-signed URL is signed with your credentials and can be used by any user.</p>
      </td>
      <td class="propExample"><p><code>https://{bucket-name}-{aws-account}-{aws-region}.s3.eu-west-1.amazonaws.com/{imageId}.{format}?{response-content}</code></p></td>
    </tr>

  </tbody>
</table>


## ImageReference
<table>
  <tbody>
    <tr>
      <th>Field name</th>
      <th>Type</th><th>Mandatory</th> <th>Other constraints</th>
      <th>Description</th>
      <th>Example</th>
    </tr>    <tr>
      <td class="propName" id="data-models-property-imagereference-id"><p>id</p></td>
      <td class="propType"><p>guid</p></td><td class="propMandatory"><p>Yes</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>The image identifier</p>
      </td>
      <td class="propExample"><p><code>269e6ae5-a49b-4ea5-85a2-9c2093c26287</code></p></td>
    </tr>

  </tbody>
</table>


## ImageStandard
<table>
  <tbody>
    <tr>
      <th>Field name</th>
      <th>Type</th><th>Mandatory</th> <th>Other constraints</th>
      <th>Description</th>
      <th>Example</th>
    </tr>    <tr>
      <td class="propName" id="data-models-property-imagestandard-id"><p>id</p></td>
      <td class="propType"><p>guid</p></td><td class="propMandatory"><p>Yes</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>The image identifier</p>
      </td>
      <td class="propExample"><p><code>269e6ae5-a49b-4ea5-85a2-9c2093c26287</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-imagestandard-imagepresignedurl"><p>imagePresignedUrl</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>A pre-signed URL that allows you to grant temporary access to image for users who don't have permission to AWS S3 bucket.</p>
        <p>A pre-signed URL is signed with your credentials and can be used by any user.</p>
      </td>
      <td class="propExample"><p><code>https://{bucket-name}-{aws-account}-{aws-region}.s3.eu-west-1.amazonaws.com/{imageId}.{format}?{response-content}</code></p></td>
    </tr>

  </tbody>
</table>


## LeasingOffer
<table>
  <tbody>
    <tr>
      <th>Field name</th>
      <th>Type</th><th>Mandatory</th> <th>Other constraints</th>
      <th>Description</th>
      <th>Example</th>
    </tr>    <tr>
      <td class="propName" id="data-models-property-leasingoffer-additionaldistancecost"><p>additionalDistanceCost</p></td>
      <td class="propType"><p>number</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>0</code></li>
          <li>Forbidden if contract type is not <code>KilometerLeasing</code></li>
          <li>Only two decimals are accepted. If more decimals are sent they will be truncated.</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Cost per additional distance (in cents per kilometer)</p>
      </td>
      <td class="propExample"><p><code>12.65</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-leasingoffer-bank"><p>bank</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. length: <code>1</code></li>
          <li class="numeric">Max. length: <code>2000</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Leasing bank (full name and address)</p>
      </td>
      <td class="propExample"><p><code>Volkswagen Bank AG, Römerstr. 145, 04109 Leipzig</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-leasingoffer-borrowingrate"><p>borrowingRate</p></td>
      <td class="propType"><p>number</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>-100</code></li>
          <li class="numeric">Max. value: <code>100</code></li>
          <li>Only two decimals are accepted. If more decimals are sent they will be truncated.</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Borrowing rate p.a. (optional)</p>
      </td>
      <td class="propExample"><p><code>95</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-leasingoffer-borrowingratetype"><p>borrowingRateType</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li>Allowed values are: <code>Bound</code>, <code>Changeable</code>, <code>Combined</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Type of nominal interest rate (optional)</p>
      </td>
      <td class="propExample"><p><code>Combined</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-leasingoffer-borrowingrateunit"><p>borrowingRateUnit</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Unit used for borrowingRate field.</p>
      </td>
      <td class="propExample"><p><code>%</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-leasingoffer-conditions"><p>conditions</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Comments on the conditions around the leasing contract</p>
      </td>
      <td class="propExample"><p><code>Begrenztes Angebot, nur bis 31.02.2020.</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-leasingoffer-contracttype"><p>contractType</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li>Allowed values are: <code>KilometerLeasing</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Type of leasing contract</p>
      </td>
      <td class="propExample"><p><code>KilometerLeasing</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-leasingoffer-dieselenvironmentalbonus"><p>dieselEnvironmentalBonus</p></td>
      <td class="propType"><p>boolean</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Does this offer only apply to customers who will scrap or trade in a diesel vehicle?</p>
      </td>
      <td class="propExample"><p><code>false</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-leasingoffer-downpayment"><p>downPayment</p></td>
      <td class="propType"><p>number</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>0</code></li>
          <li>Only two decimals are accepted. If more decimals are sent they will be truncated.</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Downpayment</p>
      </td>
      <td class="propExample"><p><code>10000</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-leasingoffer-duration"><p>duration</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>1</code></li>
          <li class="numeric">Max. value: <code>90</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Term of the contract (in months)</p>
      </td>
      <td class="propExample"><p><code>48</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-leasingoffer-durationunit"><p>durationUnit</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Unit used for duration field.</p>
      </td>
      <td class="propExample"><p><code>months</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-leasingoffer-effectiveinterestrate"><p>effectiveInterestRate</p></td>
      <td class="propType"><p>number</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>-100</code></li>
          <li class="numeric">Max. value: <code>100</code></li>
          <li>Only two decimals are accepted. If more decimals are sent they will be truncated.</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Effective interest rate (optional)</p>
      </td>
      <td class="propExample"><p><code>80</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-leasingoffer-effectiveinterestrateunit"><p>effectiveInterestRateUnit</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Unit used for effectiveInterestRate field.</p>
      </td>
      <td class="propExample"><p><code>%</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-leasingoffer-finalinstallment"><p>finalInstallment</p></td>
      <td class="propType"><p>number</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>0</code></li>
          <li>Only two decimals are accepted. If more decimals are sent they will be truncated.</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Final installment</p>
      </td>
      <td class="propExample"><p><code>9000</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-leasingoffer-grosslistprice"><p>grossListPrice</p></td>
      <td class="propType"><p>number</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>0</code></li>
          <li>Only two decimals are accepted. If more decimals are sent they will be truncated.</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Vehicle list price (gross)</p>
      </td>
      <td class="propExample"><p><code>139999.95</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-leasingoffer-grossmonthlyrate"><p>grossMonthlyRate</p></td>
      <td class="propType"><p>number</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>0.01</code></li>
          <li>Only two decimals are accepted. If more decimals are sent they will be truncated.</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Monthly rate (gross)</p>
      </td>
      <td class="propExample"><p><code>1395.95</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-leasingoffer-grossmonthlyrateunit"><p>grossMonthlyRateUnit</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Unit used for grossMonthlyRate field.</p>
      </td>
      <td class="propExample"><p><code>EUR</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-leasingoffer-hasregistrationcostsincluded"><p>hasRegistrationCostsIncluded</p></td>
      <td class="propType"><p>boolean</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Is the registration of the vehicle and the license plate included in the price?</p>
      </td>
      <td class="propExample"><p><code>false</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-leasingoffer-hastransfercostsincluded"><p>hasTransferCostsIncluded</p></td>
      <td class="propType"><p>boolean</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>0</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Is the transfer of the vehicle from the manufacturer to the dealer included in the price?</p>
      </td>
      <td class="propExample"><p><code>true</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-leasingoffer-includedmileage"><p>includedMileage</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>0</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Annual mileage (in km)</p>
      </td>
      <td class="propExample"><p><code>15000</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-leasingoffer-includedmileageunit"><p>includedMileageUnit</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Unit used for includedMileage field.</p>
      </td>
      <td class="propExample"><p><code>km</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-leasingoffer-istradeinpossible"><p>isTradeInPossible</p></td>
      <td class="propType"><p>boolean</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Whether trade-in option is possible</p>
      </td>
      <td class="propExample"><p><code>true</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-leasingoffer-leasetotalamount"><p>leaseTotalAmount</p></td>
      <td class="propType"><p>number</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>0.01</code></li>
          <li>Only two decimals are accepted. If more decimals are sent they will be truncated.</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>The total gross amount to be paid by the consumer for the entire term.</p>
      </td>
      <td class="propExample"><p><code>77005.60</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-leasingoffer-negotiable"><p>negotiable</p></td>
      <td class="propType"><p>boolean</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Monthly rate is negotiable</p>
      </td>
      <td class="propExample"><p><code>false</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-leasingoffer-netloanamount"><p>netLoanAmount</p></td>
      <td class="propType"><p>number</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>0</code></li>
          <li>Only two decimals are accepted. If more decimals are sent they will be truncated.</li>
          <li>**For LeasingMarkt customers:** May be set to 0</li>
          <li>**For all other customers:** Minimum value is 0.01</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Net loan amount (optional)</p>
      </td>
      <td class="propExample"><p><code>35956.34</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-leasingoffer-netmonthlyrate"><p>netMonthlyRate</p></td>
      <td class="propType"><p>number</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>0.01</code></li>
          <li>Only two decimals are accepted. If more decimals are sent they will be truncated.</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Monthly rate (net)</p>
      </td>
      <td class="propExample"><p><code>1095.95</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-leasingoffer-netmonthlyrateunit"><p>netMonthlyRateUnit</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Unit used for netMonthlyRate field.</p>
      </td>
      <td class="propExample"><p><code>EUR</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-leasingoffer-referenceofferid"><p>referenceOfferId</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. length: <code>1</code></li>
          <li class="numeric">Max. length: <code>50</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>A reference ID for the leasing offer from the partner.</p>
      </td>
      <td class="propExample"><p><code>a100</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-leasingoffer-refundforlessdistance"><p>refundForLessDistance</p></td>
      <td class="propType"><p>number</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>0</code></li>
          <li>Forbidden for contract type is not <code>KilometerLeasing</code></li>
          <li>Only two decimals are accepted. If more decimals are sent they will be truncated.</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Remuneration for less distance (in cents per kilometer)</p>
      </td>
      <td class="propExample"><p><code>4.65</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-leasingoffer-registrationcosts"><p>registrationCosts</p></td>
      <td class="propType"><p>number</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>0</code></li>
          <li>Only two decimals are accepted. If more decimals are sent they will be truncated.</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Total cost of vehicle registration including license plate number (if requested by the customer).</p>
      </td>
      <td class="propExample"><p><code>99</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-leasingoffer-targetgroup"><p>targetGroup</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li>Allowed values are: <code>Private</code>, <code>Business</code>, <code>Both</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Target group</p>
      </td>
      <td class="propExample"><p><code>Both</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-leasingoffer-transfercosts"><p>transferCosts</p></td>
      <td class="propType"><p>number</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li>Only two decimals are accepted. If more decimals are sent they will be truncated.</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Total costs for transporting the vehicle from the manufacturer to the dealer and subsequent preparation of the vehicle</p>
      </td>
      <td class="propExample"><p><code>100</code></p></td>
    </tr>

  </tbody>
</table>


## LeasingOfferPayload
<table>
  <tbody>
    <tr>
      <th>Field name</th>
      <th>Type</th><th>Mandatory</th> <th>Other constraints</th>
      <th>Description</th>
      <th>Example</th>
    </tr>    <tr>
      <td class="propName" id="data-models-property-leasingofferpayload-additionaldistancecost"><p>additionalDistanceCost</p></td>
      <td class="propType"><p>number</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>0</code></li>
          <li>Forbidden if contract type is not <code>KilometerLeasing</code></li>
          <li>Only two decimals are accepted. If more decimals are sent they will be truncated.</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Cost per additional distance (in cents per kilometer)</p>
      </td>
      <td class="propExample"><p><code>12.65</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-leasingofferpayload-bank"><p>bank</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>Yes</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. length: <code>1</code></li>
          <li class="numeric">Max. length: <code>2000</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Leasing bank (full name and address)</p>
      </td>
      <td class="propExample"><p><code>Volkswagen Bank AG, Römerstr. 145, 04109 Leipzig</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-leasingofferpayload-borrowingrate"><p>borrowingRate</p></td>
      <td class="propType"><p>number</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>-100</code></li>
          <li class="numeric">Max. value: <code>100</code></li>
          <li>Only two decimals are accepted. If more decimals are sent they will be truncated.</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Borrowing rate p.a. (optional)</p>
      </td>
      <td class="propExample"><p><code>95</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-leasingofferpayload-borrowingratetype"><p>borrowingRateType</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li>Allowed values are: <code>Bound</code>, <code>Changeable</code>, <code>Combined</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Type of nominal interest rate (optional)</p>
      </td>
      <td class="propExample"><p><code>Combined</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-leasingofferpayload-conditions"><p>conditions</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Comments on the conditions around the leasing contract</p>
      </td>
      <td class="propExample"><p><code>Begrenztes Angebot, nur bis 31.02.2020.</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-leasingofferpayload-contracttype"><p>contractType</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>Yes</p></td>      <td class="propConstraints">
        <ul>
          <li>Allowed values are: <code>KilometerLeasing</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Type of leasing contract</p>
      </td>
      <td class="propExample"><p><code>KilometerLeasing</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-leasingofferpayload-dieselenvironmentalbonus"><p>dieselEnvironmentalBonus</p></td>
      <td class="propType"><p>boolean</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Does this offer only apply to customers who will scrap or trade in a diesel vehicle?</p>
      </td>
      <td class="propExample"><p><code>false</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-leasingofferpayload-downpayment"><p>downPayment</p></td>
      <td class="propType"><p>number</p></td><td class="propMandatory"><p>Yes</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>0</code></li>
          <li>Only two decimals are accepted. If more decimals are sent they will be truncated.</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Downpayment</p>
      </td>
      <td class="propExample"><p><code>10000</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-leasingofferpayload-duration"><p>duration</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>Yes</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>1</code></li>
          <li class="numeric">Max. value: <code>90</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Term of the contract (in months)</p>
      </td>
      <td class="propExample"><p><code>48</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-leasingofferpayload-effectiveinterestrate"><p>effectiveInterestRate</p></td>
      <td class="propType"><p>number</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>-100</code></li>
          <li class="numeric">Max. value: <code>100</code></li>
          <li>Only two decimals are accepted. If more decimals are sent they will be truncated.</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Effective interest rate (optional)</p>
      </td>
      <td class="propExample"><p><code>80</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-leasingofferpayload-finalinstallment"><p>finalInstallment</p></td>
      <td class="propType"><p>number</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>0</code></li>
          <li>Only two decimals are accepted. If more decimals are sent they will be truncated.</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Final installment</p>
      </td>
      <td class="propExample"><p><code>9000</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-leasingofferpayload-grosslistprice"><p>grossListPrice</p></td>
      <td class="propType"><p>number</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>0</code></li>
          <li>Only two decimals are accepted. If more decimals are sent they will be truncated.</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Vehicle list price (gross)</p>
      </td>
      <td class="propExample"><p><code>139999.95</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-leasingofferpayload-grossmonthlyrate"><p>grossMonthlyRate</p></td>
      <td class="propType"><p>number</p></td><td class="propMandatory"><p>Yes</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>0.01</code></li>
          <li>Only two decimals are accepted. If more decimals are sent they will be truncated.</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Monthly rate (gross)</p>
      </td>
      <td class="propExample"><p><code>1395.95</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-leasingofferpayload-hasregistrationcostsincluded"><p>hasRegistrationCostsIncluded</p></td>
      <td class="propType"><p>boolean</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Is the registration of the vehicle and the license plate included in the price?</p>
      </td>
      <td class="propExample"><p><code>false</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-leasingofferpayload-hastransfercostsincluded"><p>hasTransferCostsIncluded</p></td>
      <td class="propType"><p>boolean</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>0</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Is the transfer of the vehicle from the manufacturer to the dealer included in the price?</p>
      </td>
      <td class="propExample"><p><code>true</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-leasingofferpayload-includedmileage"><p>includedMileage</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>Yes</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>0</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Annual mileage (in km)</p>
      </td>
      <td class="propExample"><p><code>15000</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-leasingofferpayload-istradeinpossible"><p>isTradeInPossible</p></td>
      <td class="propType"><p>boolean</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Whether trade-in option is possible</p>
      </td>
      <td class="propExample"><p><code>true</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-leasingofferpayload-leasetotalamount"><p>leaseTotalAmount</p></td>
      <td class="propType"><p>number</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>0.01</code></li>
          <li>Only two decimals are accepted. If more decimals are sent they will be truncated.</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>The total gross amount to be paid by the consumer for the entire term.</p>
      </td>
      <td class="propExample"><p><code>77005.60</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-leasingofferpayload-negotiable"><p>negotiable</p></td>
      <td class="propType"><p>boolean</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Monthly rate is negotiable</p>
      </td>
      <td class="propExample"><p><code>false</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-leasingofferpayload-netloanamount"><p>netLoanAmount</p></td>
      <td class="propType"><p>number</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>0</code></li>
          <li>Only two decimals are accepted. If more decimals are sent they will be truncated.</li>
          <li>**For LeasingMarkt customers:** May be set to 0</li>
          <li>**For all other customers:** Minimum value is 0.01</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Net loan amount (optional)</p>
      </td>
      <td class="propExample"><p><code>35956.34</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-leasingofferpayload-netmonthlyrate"><p>netMonthlyRate</p></td>
      <td class="propType"><p>number</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>0.01</code></li>
          <li>Only two decimals are accepted. If more decimals are sent they will be truncated.</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Monthly rate (net)</p>
      </td>
      <td class="propExample"><p><code>1095.95</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-leasingofferpayload-referenceofferid"><p>referenceOfferId</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. length: <code>1</code></li>
          <li class="numeric">Max. length: <code>50</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>A reference ID for the leasing offer from the partner.</p>
      </td>
      <td class="propExample"><p><code>a100</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-leasingofferpayload-refundforlessdistance"><p>refundForLessDistance</p></td>
      <td class="propType"><p>number</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>0</code></li>
          <li>Forbidden for contract type is not <code>KilometerLeasing</code></li>
          <li>Only two decimals are accepted. If more decimals are sent they will be truncated.</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Remuneration for less distance (in cents per kilometer)</p>
      </td>
      <td class="propExample"><p><code>4.65</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-leasingofferpayload-registrationcosts"><p>registrationCosts</p></td>
      <td class="propType"><p>number</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>0</code></li>
          <li>Only two decimals are accepted. If more decimals are sent they will be truncated.</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Total cost of vehicle registration including license plate number (if requested by the customer).</p>
      </td>
      <td class="propExample"><p><code>99</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-leasingofferpayload-targetgroup"><p>targetGroup</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>Yes</p></td>      <td class="propConstraints">
        <ul>
          <li>Allowed values are: <code>Private</code>, <code>Business</code>, <code>Both</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Target group</p>
      </td>
      <td class="propExample"><p><code>Both</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-leasingofferpayload-transfercosts"><p>transferCosts</p></td>
      <td class="propType"><p>number</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li>Only two decimals are accepted. If more decimals are sent they will be truncated.</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Total costs for transporting the vehicle from the manufacturer to the dealer and subsequent preparation of the vehicle</p>
      </td>
      <td class="propExample"><p><code>100</code></p></td>
    </tr>

  </tbody>
</table>


## LeasingOffers
<table>
  <tbody>
    <tr>
      <th>Field name</th>
      <th>Type</th><th>Mandatory</th> <th>Other constraints</th>
      <th>Description</th>
      <th>Example</th>
    </tr>    <tr>
      <td class="propName" id="data-models-property-leasingoffers-offers"><p>offers</p></td>
      <td class="propType"><p>array[<a href="#/data-models?id=leasingoffer">LeasingOffer</a>]</p></td><td class="propMandatory"><p>Yes</p></td>      <td class="propConstraints">
        <ul>
          <li>Not available for dealers outside germany. This attribute only applies for customers that are dealers.</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Allows a dealer to offer leasing when selling the vehicle.</p>
      </td>
      <td class="propExample"><p></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-leasingoffers-providerid"><p>providerId</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>leasing offers id</p>
      </td>
      <td class="propExample"><p><code>823892</code></p></td>
    </tr>

  </tbody>
</table>


## LeasingOffersPayload
<table>
  <tbody>
    <tr>
      <th>Field name</th>
      <th>Type</th><th>Mandatory</th> <th>Other constraints</th>
      <th>Description</th>
      <th>Example</th>
    </tr>    <tr>
      <td class="propName" id="data-models-property-leasingofferspayload-offers"><p>offers</p></td>
      <td class="propType"><p>array[<a href="#/data-models?id=leasingofferpayload">LeasingOfferPayload</a>]</p></td><td class="propMandatory"><p>Yes</p></td>      <td class="propConstraints">
        <ul>
          <li>Not available for dealers outside germany. This attribute only applies for customers that are dealers.</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Allows a dealer to offer leasing when selling the vehicle.</p>
      </td>
      <td class="propExample"><p></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-leasingofferspayload-providerid"><p>providerId</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>leasing offers id</p>
      </td>
      <td class="propExample"><p><code>823892</code></p></td>
    </tr>

  </tbody>
</table>


## Listing
<table>
  <tbody>
    <tr>
      <th>Field name</th>
      <th>Type</th><th>Mandatory</th> <th>Other constraints</th>
      <th>Description</th>
      <th>Example</th>
    </tr>    <tr>
      <td class="propName" id="data-models-property-listing-additionalfueltypes"><p>additionalFuelTypes</p></td>
      <td class="propType"><p>array[integer]</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li>Items must be unique</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Additional supported fuel types that might accompany the primary fuel type.</p>
        <p>These fuel types can also be consumed by the vehicle but have higher emissions than the primary fuel type.</p>
        <p>This is derived from German emission/consumption regulations for vehicles (EnVKV).</p>
      </td>
      <td class="propExample"><p></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-alloywheelsize"><p>alloyWheelSize</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>10</code></li>
          <li class="numeric">Max. value: <code>26</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Size of alloy wheels of the vehicle (in inches).</p>
      </td>
      <td class="propExample"><p><code>18</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-alloywheelsizeunit"><p>alloyWheelSizeUnit</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Unit used for alloyWheel field.</p>
      </td>
      <td class="propExample"><p><code>in</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-appliedseals"><p>appliedSeals</p></td>
      <td class="propType"><p>array[integer]</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li>Items must be unique</li>
          <li>This attribute only applies for customers that are dealers.</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>List of applied car seals shown on the listing.</p>
        <p>Sometimes additional seals are added or removed automatically, irrespective of the seals set using the <code>requestedSeals</code> property</p>
        <p>Note: this attribute is set for informational purposes as part of our read-only endpoints.</p>
        <p>Please use <code>requestedSeals</code> if you want to submit seals instead.</p>
      </td>
      <td class="propExample"><p></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-autoproff"><p>autoproff</p></td>
      <td class="propType"><p><a href="#/data-models?id=autoproff">Autoproff</a></p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li>This attribute only applies for customers that are dealers.</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Provides autoproff-related data for the listing. Can not be set by data providers.</p>
      </td>
      <td class="propExample"><p></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-auxiliarypower"><p>auxiliaryPower</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li>Allowed values can be retrieved via the references API (reference type FuelCategory)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Auxiliary power source type.</p>
      </td>
      <td class="propExample"><p><code>B</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-availability"><p>availability</p></td>
      <td class="propType"><p><a href="#/data-models?id=availability">Availability</a></p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li>This attribute only applies for customers that are dealers.</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Provides information about when the vehicle is available.</p>
      </td>
      <td class="propExample"><p></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-axlecount"><p>axleCount</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>1</code></li>
          <li class="numeric">Max. value: <code>6</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>The number of axles the vehicle has.</p>
      </td>
      <td class="propExample"><p><code>1</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-axlespread"><p>axleSpread</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>1</code></li>
          <li class="numeric">Max. value: <code>10000</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Axle spread in millimeters.</p>
      </td>
      <td class="propExample"><p><code>5000</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-battery"><p>battery</p></td>
      <td class="propType"><p><a href="#/data-models?id=battery">Battery</a></p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Information about the vehicle's battery</p>
      </td>
      <td class="propExample"><p></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-bedcount"><p>bedCount</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>0</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Total number of beds.</p>
      </td>
      <td class="propExample"><p><code>4</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-belgiancarpassmileageurl"><p>belgianCarpassMileageUrl</p></td>
      <td class="propType"><p>url</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>The URL for the Carpass technical inspection for the listed vehicle</p>
      </td>
      <td class="propExample"><p><code>https://public.car-pass.be/vhr/2a0f0719-1b7a-4e42-84e1-c5c746ab1c39</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-bodycolor"><p>bodyColor</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Basic body color of the vehicle.</p>
      </td>
      <td class="propExample"><p><code>2</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-bodycolorname"><p>bodyColorName</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. length: <code>1</code></li>
          <li class="numeric">Max. length: <code>30</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Manufacturers name of body color</p>
      </td>
      <td class="propExample"><p><code>British Racing Green</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-bodytype"><p>bodyType</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Shape of vehicle’s body.</p>
        <p>Valid values for this reference type are dependent on the marketplace country of the customer.</p>
        <p>Allowed values can be retrieved via the references API (reference type BodyType)</p>
      </td>
      <td class="propExample"><p><code>1</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-braketype"><p>brakeType</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li>Allowed values can be retrieved via the references API (reference type BrakeType)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Brake type.</p>
      </td>
      <td class="propExample"><p><code>A</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-cabinaxledistance"><p>cabinAxleDistance</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>1</code></li>
          <li class="numeric">Max. value: <code>10000</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Cabin to axle distance in millimeters.</p>
      </td>
      <td class="propExample"><p><code>3500</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-chassisbedlength"><p>chassisBedLength</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li>Allowed values can be retrieved via the references API (reference type ChassisBedLength)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Chassis bed length.</p>
      </td>
      <td class="propExample"><p><code>L</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-chassismanufacturername"><p>chassisManufacturerName</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Max. length: <code>100</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Chassis manufacturer name.</p>
      </td>
      <td class="propExample"><p><code>Ford</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-co2emissions"><p>co2Emissions</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Vehicle’s carbon dioxide emission in g/km.</p>
      </td>
      <td class="propExample"><p><code>23</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-co2emissionsunit"><p>co2EmissionsUnit</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Unit used for co2Emissions field.</p>
      </td>
      <td class="propExample"><p><code>g/km</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-combinedunit"><p>combinedUnit</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Unit used for combined field.</p>
      </td>
      <td class="propExample"><p><code>l/100km</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-condition"><p>condition</p></td>
      <td class="propType"><p><a href="#/data-models?id=condition">Condition</a></p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Describes the current condition of the vehicle</p>
      </td>
      <td class="propExample"><p></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-consumption"><p>consumption</p></td>
      <td class="propType"><p><a href="#/data-models?id=consumption">Consumption</a></p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Provides fuel and electric consumption information for the vehicle.</p>
      </td>
      <td class="propExample"><p></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-costmodel"><p>costModel</p></td>
      <td class="propType"><p><a href="#/data-models?id=costmodel">CostModel</a></p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Provides cost information for the vehicle.</p>
      </td>
      <td class="propExample"><p></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-countryversion"><p>countryVersion</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Indicates the original market/country the vehicle was built for.</p>
      </td>
      <td class="propExample"><p><code>AT</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-crossreferenceid"><p>crossReferenceId</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. length: <code>1</code></li>
          <li class="numeric">Max. length: <code>50</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>A reference that can be used when managing or identifying listings.</p>
        <p>This information will not be shown on the AutoScout24 platform.</p>
      </td>
      <td class="propExample"><p><code>DATX_002</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-cylindercapacity"><p>cylinderCapacity</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>1</code></li>
          <li class="numeric">Max. value: <code>99999</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Volume of the engines cylinders in cubic centimeters.</p>
      </td>
      <td class="propExample"><p><code>1998</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-cylindercapacityunit"><p>cylinderCapacityUnit</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Unit used for cylinderCapacity field</p>
      </td>
      <td class="propExample"><p><code>m3</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-cylindercount"><p>cylinderCount</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>1</code></li>
          <li class="numeric">Max. value: <code>99</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>The number of cylinders of the engine.</p>
      </td>
      <td class="propExample"><p><code>4</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-description"><p>description</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Max. length: <code>10000</code></li>
          <li>Note that currently only the first 10000 characters are displayed. Generally 1 character is equal to 1 byte but characters from the extended alphabet like “ä” count as 2 bytes.</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Free text description of the vehicle.</p>
      </td>
      <td class="propExample"><p><code>This car is **great**. \ It has the following features: \ * Low price \ * Great interior
</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-differentialratio"><p>differentialRatio</p></td>
      <td class="propType"><p>double</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>0.01</code></li>
          <li class="numeric">Max. value: <code>100</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Differential ratio with precision 4 and scale 2.</p>
      </td>
      <td class="propExample"><p><code>3.73</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-doorcount"><p>doorCount</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>1</code></li>
          <li class="numeric">Max. value: <code>9</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Number of doors the vehicle has</p>
      </td>
      <td class="propExample"><p><code>5</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-drivetrain"><p>drivetrain</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Drive type of the vehicle.</p>
      </td>
      <td class="propExample"><p><code>R</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-drivingmode"><p>drivingMode</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li>Allowed values are: <code>ChainDrive</code>, <code>BeltDrive</code>, <code>CrankDrive</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>The drive type of the bike. Possible values are ChainDrive, BeltDrive, CrankDrive.</p>
      </td>
      <td class="propExample"><p><code>ChainDrive</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-ecode"><p>eCode</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. length: <code>15</code></li>
          <li class="numeric">Max. length: <code>15</code></li>
          <li>It should begins with "01" or "02" or "03" or "04" or "05"</li>
          <li>All characters should be numeric</li>
          <li>It is not allowed for vehicleType <code>L</code> (trailer)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Classification of makes and models given by data vendor DAT</p>
      </td>
      <td class="propExample"><p><code>010200020100001</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-efficiencyclass"><p>efficiencyClass</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Vehicle’s energy efficiency class.</p>
      </td>
      <td class="propExample"><p><code>2</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-electriccombinedunit"><p>electricCombinedUnit</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Unit used for electricCombined field.</p>
      </td>
      <td class="propExample"><p><code>kWh/100km</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-electricrange"><p>electricRange</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>1</code></li>
          <li class="numeric">Max. value: <code>10000</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>The electric range of the vehicle in kilometers according to WLTP. (EAER)</p>
      </td>
      <td class="propExample"><p><code>410</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-electricrangecity"><p>electricRangeCity</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>1</code></li>
          <li class="numeric">Max. value: <code>10000</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>The electric range of the vehicle in kilometers according to WLTP measured in cities. (EAER city)</p>
      </td>
      <td class="propExample"><p><code>620</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-emptyweight"><p>emptyWeight</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>1</code></li>
          <li class="numeric">Max. value: <code>99999</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Vehicle’s weight without driver, passengers or liquids (like fuel) in kg.</p>
      </td>
      <td class="propExample"><p><code>1200</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-emptyweightgrams"><p>emptyWeightGrams</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>1000</code></li>
          <li class="numeric">Max. value: <code>99999000</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Vehicle’s weight without driver, passengers or liquids (like fuel) in grams.</p>
        <p>Use this field instead of emptyWeight when submitting values in imperial units (lbs) to avoid rounding loss.</p>
      </td>
      <td class="propExample"><p><code>1200000</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-emptyweightunit"><p>emptyWeightUnit</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Unit used for emtyWeight field.</p>
      </td>
      <td class="propExample"><p><code>kg</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-enginecoolingsystem"><p>engineCoolingSystem</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li>Allowed values can be retrieved via the references API (reference type EngineCoolingSystem)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Engine cooling system type.</p>
      </td>
      <td class="propExample"><p><code>O</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-enginecount"><p>engineCount</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>0</code></li>
          <li class="numeric">Max. value: <code>10</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Number of engines.</p>
      </td>
      <td class="propExample"><p><code>2</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-enginehours"><p>engineHours</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>0</code></li>
          <li class="numeric">Max. value: <code>1000000</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Engine operating hours.</p>
      </td>
      <td class="propExample"><p><code>1500</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-enginemanufacturername"><p>engineManufacturerName</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Max. length: <code>200</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Engine manufacturer name.</p>
      </td>
      <td class="propExample"><p><code>Yamaha</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-enginemountingtype"><p>engineMountingType</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li>Allowed values can be retrieved via the references API (reference type EngineMountingType)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Engine mounting type.</p>
      </td>
      <td class="propExample"><p><code>S</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-equipment"><p>equipment</p></td>
      <td class="propType"><p>array[integer]</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li>Items must be unique</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>List of vehicle’s equipment</p>
      </td>
      <td class="propExample"><p></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-euemissionstandard"><p>euEmissionStandard</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>The EU emission standard indicates the amount of harmful substances the vehicle emits.</p>
        <p>The classification is in accordance with the European Standard Euronorm</p>
      </td>
      <td class="propExample"><p><code>1</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-europalletstoragespaces"><p>europalletStorageSpaces</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>The number of europallets that can be transported by the vehicle.</p>
      </td>
      <td class="propExample"><p><code>5</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-extendedlength"><p>extendedLength</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>1</code></li>
          <li class="numeric">Max. value: <code>50000</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Extended length in millimeters.</p>
      </td>
      <td class="propExample"><p><code>8000</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-exteriormaterial"><p>exteriorMaterial</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li>Allowed values can be retrieved via the references API (reference type ExteriorMaterial)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Exterior material type.</p>
      </td>
      <td class="propExample"><p><code>S</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-financingoffer"><p>financingOffer</p></td>
      <td class="propType"><p><a href="#/data-models?id=financingoffer">FinancingOffer</a></p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li>This attribute only applies for customers that are dealers.</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Provides information about the financing offer of the listing</p>
      </td>
      <td class="propExample"><p></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-firstactivateddate"><p>firstActivatedDate</p></td>
      <td class="propType"><p>date-time</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Date of the listing first activation</p>
      </td>
      <td class="propExample"><p><code>2025-10-29T14:38:45.007421Z</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-firstregistrationdate"><p>firstRegistrationDate</p></td>
      <td class="propType"><p>year-month</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Month and year of first registration of the vehicle.</p>
      </td>
      <td class="propExample"><p><code>2015-01</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-flooringmaterial"><p>flooringMaterial</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li>Allowed values can be retrieved via the references API (reference type Flooring)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Flooring material type.</p>
      </td>
      <td class="propExample"><p><code>S</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-fridgecapacity"><p>fridgeCapacity</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>1</code></li>
          <li class="numeric">Max. value: <code>1000</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Fridge capacity in liters.</p>
      </td>
      <td class="propExample"><p><code>100</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-fridgecapacitymilliliters"><p>fridgeCapacityMilliliters</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>1000</code></li>
          <li class="numeric">Max. value: <code>1000000</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Fridge capacity in milliliters.</p>
      </td>
      <td class="propExample"><p><code>100000</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-fridgepowertype"><p>fridgePowerType</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li>Allowed values can be retrieved via the references API (reference type FridgePowerType)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Fridge power type.</p>
      </td>
      <td class="propExample"><p><code>E</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-frontaxleweightrating"><p>frontAxleWeightRating</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>1</code></li>
          <li class="numeric">Max. value: <code>100000</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Front axle weight rating in kilograms.</p>
      </td>
      <td class="propExample"><p><code>7500</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-frontaxleweightratinggrams"><p>frontAxleWeightRatingGrams</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>1000</code></li>
          <li class="numeric">Max. value: <code>100000000</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Front axle weight rating in grams.</p>
      </td>
      <td class="propExample"><p><code>7500000</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-fuelcapacity"><p>fuelCapacity</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>1</code></li>
          <li class="numeric">Max. value: <code>1000</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Fuel capacity in liters.</p>
      </td>
      <td class="propExample"><p><code>200</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-fuelcapacitymilliliters"><p>fuelCapacityMilliliters</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>1000</code></li>
          <li class="numeric">Max. value: <code>1000000</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Fuel capacity in milliliters.</p>
      </td>
      <td class="propExample"><p><code>200000</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-fuelcategory"><p>fuelCategory</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Category of fuel/energy source for the vehicle.</p>
        <p>Valid values for this reference type are dependent on the marketplace country of the customer.</p>
        <p>Allowed values can be retrieved via the references API (reference type FuelCategory)</p>
      </td>
      <td class="propExample"><p><code>B</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-fueldeliverytype"><p>fuelDeliveryType</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li>Allowed values can be retrieved via the references API (reference type FuelDeliveryType)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Fuel delivery type.</p>
      </td>
      <td class="propExample"><p><code>I</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-gearcount"><p>gearCount</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>1</code></li>
          <li class="numeric">Max. value: <code>9</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Number of gears of the vehicle</p>
      </td>
      <td class="propExample"><p><code>6</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-germanemissionssticker"><p>germanEmissionsSticker</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Emissions sticker type as assigned by German technical inspection authorities (Umweltplakette/Feinstaubplakette).</p>
        <p>Allowed values can be retrieved via the references API (reference type EmissionsSticker)</p>
      </td>
      <td class="propExample"><p><code>1</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-grossvehicleweight"><p>grossVehicleWeight</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>1</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>The maximum operating weight of a vehicle including its chassis, body, engine, engine fluids, fuel,</p>
        <p>accessories, driver, passengers and cargo.</p>
      </td>
      <td class="propExample"><p><code>3500</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-grossvehicleweightgrams"><p>grossVehicleWeightGrams</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>1000</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>The maximum operating weight of a vehicle in grams, including its chassis, body, engine, engine fluids, fuel, accessories, driver, passengers and cargo.</p>
        <p>Use this field instead of grossVehicleWeight when submitting values in imperial units (lbs) to avoid rounding loss.</p>
      </td>
      <td class="propExample"><p><code>3500000</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-grossvehicleweightunit"><p>grossVehicleWeightUnit</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Unit used for grossVehicleWeight field.</p>
      </td>
      <td class="propExample"><p><code>kg</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-hascarregistration"><p>hasCarRegistration</p></td>
      <td class="propType"><p>boolean</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Indicates whether a vehicle is registered as a car in the registration documents</p>
      </td>
      <td class="propExample"><p><code>false</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-hasfullservicehistory"><p>hasFullServiceHistory</p></td>
      <td class="propType"><p>boolean</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Indicates whether vehicle has passed all periodic maintenance as recommended by the vehicle manufacturer.</p>
      </td>
      <td class="propExample"><p><code>false</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-hasparticlefilter"><p>hasParticleFilter</p></td>
      <td class="propType"><p>boolean</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Indicates whether a diesel vehicle is equipped with a particle filter</p>
      </td>
      <td class="propExample"><p><code>true</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-haswarranty"><p>hasWarranty</p></td>
      <td class="propType"><p>boolean</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li>This attribute only applies for customers that are dealers.</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Whether the vehicle has warranty.</p>
        <p>If warranty is set to 0 this can't be set to 'true'</p>
        <p>If warranty is set to > 0 this can't be set to 'false'</p>
      </td>
      <td class="propExample"><p><code>true</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-headcount"><p>headCount</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>0</code></li>
          <li class="numeric">Max. value: <code>20</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Total number of heads (bathrooms).</p>
      </td>
      <td class="propExample"><p><code>2</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-highlights"><p>highlights</p></td>
      <td class="propType"><p>array[<a href="#/data-models?id=highlight">Highlight</a>]</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Maximum number of items is 3</li>
          <li>This attribute only applies for customers that are dealers.</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Short notes highlighting key features of the vehicle</p>
        <p><strong>🚧 This functionality is currently under construction and will not be shown to Autoscout24 users</strong></p>
      </td>
      <td class="propExample"><p></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-hsn"><p>hsn</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. length: <code>4</code></li>
          <li class="numeric">Max. length: <code>4</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Herstellerschluesselnummer, or the unique identifier of vehicle manufacturer in Germany.</p>
        <p>In combination with TSN this key is used to uniquely identify a vehicle type.</p>
        <p>The make of a vehicle can be fully derived from this identifier.</p>
      </td>
      <td class="propExample"><p><code>0583</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-hullmaterial"><p>hullMaterial</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li>Allowed values can be retrieved via the references API (reference type HullMaterial)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Hull material type.</p>
      </td>
      <td class="propExample"><p><code>S</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-id"><p>id</p></td>
      <td class="propType"><p>guid</p></td><td class="propMandatory"><p>Yes</p></td>      <td class="propConstraints">
        <ul>
          <li>Mandatory for all listings</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>The unique identifier of the listing</p>
      </td>
      <td class="propExample"><p><code>cf04da2d-9c57-4758-8735-5257e4eb1cae</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-images"><p>images</p></td>
      <td class="propType"><p>array[<a href="#/data-models?id=image">Image</a>]</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Maximum number of items is 50</li>
          <li>Items must be unique</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>The images that are associated with this listing.</p>
      </td>
      <td class="propExample"><p></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-includedservices"><p>includedServices</p></td>
      <td class="propType"><p>array[integer]</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li>Items must be unique</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Included services as part of the vehicle offer.</p>
        <p>Values <code>1</code> for German dealers (HU/AU) and <code>2</code> for Dutch dealers indicate that an inspection has been done recently and the vehicle is in a roadworthy state.</p>
      </td>
      <td class="propExample"><p></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-iseureimport"><p>isEUReimport</p></td>
      <td class="propType"><p>boolean</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li>This attribute is only available for Smyle listings at the moment. Its value won't be considered valid and won't be displayed in the AutoScout24 websites. This is up to change in the future.</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Whether the vehicle is EU reimported.</p>
      </td>
      <td class="propExample"><p><code>true</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-ismetallic"><p>isMetallic</p></td>
      <td class="propType"><p>boolean</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Whether the vehicle’s body color has a metallic effect.</p>
      </td>
      <td class="propExample"><p><code>true</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-isnonsmoking"><p>isNonSmoking</p></td>
      <td class="propType"><p>boolean</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Whether the vehicle has been used by non-smokers only.</p>
      </td>
      <td class="propExample"><p><code>true</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-ispluginhybrid"><p>isPluginHybrid</p></td>
      <td class="propType"><p>boolean</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li>If this property is set to <code>true</code>, then:</li>
          <li><code>primaryFuelType</code> OR <code>additionalFuelTypes</code> must contain <code>12</code> (Electric) AND <code>primaryFuelType</code> OR <code>additionalFuelTypes</code> must contain one fuel type != <code>12</code> (Electric)</li></li>
          <li><code>fuelCategory</code> must be one of <code>3</code> (Electric/Diesel), <code>2</code> (Electric/Benzin) or <code>O</code> Others</li></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Whether the vehicle is a plugin hybrid.</p>
      </td>
      <td class="propExample"><p><code>true</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-isreserved"><p>isReserved</p></td>
      <td class="propType"><p>boolean</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li>This attribute is only available for Smyle listings at the moment. Its value won't be considered valid and won't be displayed in the AutoScout24 websites. This is up to change in the future.</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Whether the vehicle is reserved.</p>
      </td>
      <td class="propExample"><p><code>true</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-lastcambeltservicedate"><p>lastCamBeltServiceDate</p></td>
      <td class="propType"><p>year-month</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Date of last cam belt exchange.</p>
        <p>Cannot be in the future.</p>
      </td>
      <td class="propExample"><p><code>2016-01</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-lasttechnicalservicedate"><p>lastTechnicalServiceDate</p></td>
      <td class="propType"><p>year-month</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Date of last periodic maintenance</p>
      </td>
      <td class="propExample"><p><code>2016-06</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-leasingoffers"><p>leasingOffers</p></td>
      <td class="propType"><p><a href="#/data-models?id=leasingoffers">LeasingOffers</a></p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li>Not available for dealers outside germany. This attribute only applies for customers that are dealers.</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Allows a dealer to offer leasing when selling the vehicle.</p>
      </td>
      <td class="propExample"><p></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-licenceplate"><p>licencePlate</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. length: <code>1</code></li>
          <li class="numeric">Max. length: <code>10</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Licence plate number of the vehicle</p>
      </td>
      <td class="propExample"><p><code>M-2411-DC</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-loadheight"><p>loadHeight</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>1</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Maximum height of the load.</p>
      </td>
      <td class="propExample"><p><code>1900</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-loadheightunit"><p>loadHeightUnit</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Unit used for loadHeight field.</p>
      </td>
      <td class="propExample"><p><code>mm</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-loadlength"><p>loadLength</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>1</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Maximum length of the load.</p>
      </td>
      <td class="propExample"><p><code>3800</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-loadlengthunit"><p>loadLengthUnit</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Unit used for loadLength field.</p>
      </td>
      <td class="propExample"><p><code>mm</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-loadvolume"><p>loadVolume</p></td>
      <td class="propType"><p>number</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Maximum volume of the load.</p>
      </td>
      <td class="propExample"><p><code>5.5</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-loadvolumeunit"><p>loadVolumeUnit</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Unit used for loadVolume field.</p>
      </td>
      <td class="propExample"><p><code>m3</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-loadwidth"><p>loadWidth</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>1</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Maximum width of the load.</p>
      </td>
      <td class="propExample"><p><code>2100</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-loadwidthunit"><p>loadWidthUnit</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Unit used for loadWidth field.</p>
      </td>
      <td class="propExample"><p><code>mm</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-make"><p>make</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>Yes</p></td>      <td class="propConstraints">
        <ul>
          <li>Mandatory for all listings</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Make identifier of the vehicle.</p>
        <p>Allowed values can be retrieved via the makes API</p>
      </td>
      <td class="propExample"><p><code>13</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-marketing"><p>marketing</p></td>
      <td class="propType"><p><a href="#/data-models?id=marketing">Marketing</a></p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li>This attribute only applies for customers that are dealers.</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Provides additional marketing information</p>
      </td>
      <td class="propExample"><p></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-maximumtowingweight"><p>maximumTowingWeight</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>1</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>The maximum weight the vehicle can tow.</p>
      </td>
      <td class="propExample"><p><code>130</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-maximumtowingweightunit"><p>maximumTowingWeightUnit</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Unit used for maximumTowingWeight field.</p>
      </td>
      <td class="propExample"><p><code>kg</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-mileage"><p>mileage</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>The distance that the vehicle has run</p>
      </td>
      <td class="propExample"><p><code>75000</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-mileageunit"><p>mileageUnit</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Unit used for mileage field</p>
      </td>
      <td class="propExample"><p><code>km</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-model"><p>model</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>The model of the vehicle (for cars and bikes)</p>
        <p>Allowed values can be retrieved via the makes API</p>
      </td>
      <td class="propExample"><p><code>1641</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-modelname"><p>modelName</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Max. length: <code>50</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>The model of the vehicle (for Light Commercial Vehicles, Trailers, Caravans/Mobile homes)</p>
      </td>
      <td class="propExample"><p><code>Sprinter 310 Carlsen</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-modelversion"><p>modelVersion</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. length: <code>1</code></li>
          <li class="numeric">Max. length: <code>121</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Additional information about the model</p>
      </td>
      <td class="propExample"><p><code>Avant</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-natcode"><p>natCode</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Max. length: <code>22</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Classification of makes and models given by Eurotax/Schwacke</p>
      </td>
      <td class="propExample"><p><code>20239429</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-nextinspectiondate"><p>nextInspectionDate</p></td>
      <td class="propType"><p>year-month</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Date of next technical inspection as required by regulations.</p>
      </td>
      <td class="propExample"><p><code>2028-01</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-offerreferenceid"><p>offerReferenceId</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. length: <code>1</code></li>
          <li class="numeric">Max. length: <code>50</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>A reference ID for the vehicle that can be used by buyers.</p>
        <p>Will be shown on the AutoScout24 plaform</p>
      </td>
      <td class="propExample"><p><code>A12453</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-offertype"><p>offerType</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Specifies the offer type of the vehicle.</p>
        <p>Allowed values can be retrieved via the references API (reference type OfferType)</p>
      </td>
      <td class="propExample"><p><code>U</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-oilcapacity"><p>oilCapacity</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>0</code></li>
          <li class="numeric">Max. value: <code>100</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Oil capacity in liters.</p>
      </td>
      <td class="propExample"><p><code>10</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-oilcapacitymilliliters"><p>oilCapacityMilliliters</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>0</code></li>
          <li class="numeric">Max. value: <code>100000</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Oil capacity in milliliters.</p>
      </td>
      <td class="propExample"><p><code>10000</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-onlinesale"><p>onlineSale</p></td>
      <td class="propType"><p><a href="#/data-models?id=onlinesale">OnlineSale</a></p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li>This attribute only applies for customers that are dealers.</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Provides information about the online sale of the listing.</p>
      </td>
      <td class="propExample"><p></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-overwriteprotection"><p>overwriteProtection</p></td>
      <td class="propType"><p>boolean</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li>This attribute only applies for customers that are dealers.</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>When overwriteProtection is true, it’s not possible to edit or delete the listing using the API.</p>
        <p>Changes or deletions are only possible on the listing using the dealers My Area on the website.</p>
        <p>The dealer can also deactivate this option through My Area.</p>
        <p>A missing value is equivalent to false.</p>
      </td>
      <td class="propExample"><p><code>false</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-payload"><p>payload</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>0</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Maximum payload the vehicle can carry.</p>
      </td>
      <td class="propExample"><p><code>2900</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-payloadunit"><p>payloadUnit</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Unit used for payload field</p>
      </td>
      <td class="propExample"><p><code>kg</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-power"><p>power</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>1</code></li>
          <li class="numeric">Max. value: <code>9999</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Engine power in kW. Power in (German) PS does not need to be specified, as it will automatically be derived from this value.</p>
      </td>
      <td class="propExample"><p><code>110</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-powerunit"><p>powerUnit</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Unit used for power field</p>
      </td>
      <td class="propExample"><p><code>kW</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-previousownercount"><p>previousOwnerCount</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>0</code></li>
          <li class="numeric">Max. value: <code>99</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Number of previous vehicle owners.</p>
      </td>
      <td class="propExample"><p><code>1</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-prices"><p>prices</p></td>
      <td class="propType"><p><a href="#/data-models?id=prices">Prices</a></p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Provides price information for the vehicle.</p>
      </td>
      <td class="propExample"><p></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-primaryfueltype"><p>primaryFuelType</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Fuel type with the lowest emission for the vehicle. This is derived from German emission/consumption regulations for vehicles (EnVKV).</p>
        <p>Allowed values can be retrieved via the references API (reference type FuelType).</p>
      </td>
      <td class="propExample"><p><code>1</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-productionyear"><p>productionYear</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>The year when the vehicle was manufactured.</p>
      </td>
      <td class="propExample"><p><code>2014</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-publication"><p>publication</p></td>
      <td class="propType"><p><a href="#/data-models?id=publication">Publication</a></p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Provides information about the publication status of the listing.</p>
      </td>
      <td class="propExample"><p></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-rearaxleweightrating"><p>rearAxleWeightRating</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>1</code></li>
          <li class="numeric">Max. value: <code>100000</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Rear axle weight rating in kilograms.</p>
      </td>
      <td class="propExample"><p><code>8500</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-rearaxleweightratinggrams"><p>rearAxleWeightRatingGrams</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>1000</code></li>
          <li class="numeric">Max. value: <code>100000000</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Rear axle weight rating in grams.</p>
      </td>
      <td class="propExample"><p><code>8500000</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-schwackecode"><p>schwackeCode</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Max. length: <code>22</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Classification of makes and models given by Eurotax/Schwacke</p>
      </td>
      <td class="propExample"><p><code>20239429</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-seatcount"><p>seatCount</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>1</code></li>
          <li class="numeric">Max. value: <code>99</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Number of seats of the vehicle</p>
      </td>
      <td class="propExample"><p><code>5</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-skistancewidth"><p>skiStanceWidth</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>1</code></li>
          <li class="numeric">Max. value: <code>2000</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Ski stance width in millimeters.</p>
      </td>
      <td class="propExample"><p><code>1000</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-slideoutcount"><p>slideOutCount</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>0</code></li>
          <li class="numeric">Max. value: <code>10</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Number of slide-outs.</p>
      </td>
      <td class="propExample"><p><code>2</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-steeringtype"><p>steeringType</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li>Allowed values can be retrieved via the references API (reference type SteeringType)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Steering type.</p>
      </td>
      <td class="propExample"><p><code>T</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-totalheight"><p>totalHeight</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>1</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Height of the vehicle in mm. Only available when vehicleType is <code>N</code>.</p>
      </td>
      <td class="propExample"><p><code>200</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-totalheightunit"><p>totalHeightUnit</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Unit used for totalHeight field.</p>
      </td>
      <td class="propExample"><p><code>mm</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-totallength"><p>totalLength</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>1</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Length of the vehicle in mm. Only available when vehicleType is <code>N</code>.</p>
      </td>
      <td class="propExample"><p><code>200</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-totallengthunit"><p>totalLengthUnit</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Unit used for totalLength field.</p>
      </td>
      <td class="propExample"><p><code>mm</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-totalwidth"><p>totalWidth</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>1</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Width of the vehicle in mm. Only available when vehicleType is <code>N</code></p>
      </td>
      <td class="propExample"><p><code>200</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-totalwidthunit"><p>totalWidthUnit</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Unit used for totalWidth field.</p>
      </td>
      <td class="propExample"><p><code>mm</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-transmission"><p>transmission</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Specifies the transmission type of the vehicle (e.g. manual, automatic).</p>
        <p>Valid values for this reference type are dependent on the marketplace country of the customer.</p>
        <p>Allowed values can be retrieved via the references API (reference type Transmission).</p>
      </td>
      <td class="propExample"><p><code>M</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-tsn"><p>tsn</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. length: <code>3</code></li>
          <li class="numeric">Max. length: <code>3</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Typschluesselnummer: Identifier used by vehicle manufacturers in Germany to specify a vehicle type.</p>
        <p>From TSN the following parameters can be derived: Model, body, engine type, fuel type etc.</p>
        <p>Combined with HSN a make/model combination can be fully specified.</p>
      </td>
      <td class="propExample"><p><code>936</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-twinner"><p>twinner</p></td>
      <td class="propType"><p><a href="#/data-models?id=twinnerpayload">TwinnerPayload</a></p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Provides Twinner information for the vehicle.</p>
      </td>
      <td class="propExample"><p></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-twinner"><p>twinner</p></td>
      <td class="propType"><p><a href="#/data-models?id=twinnerpayload">TwinnerPayload</a></p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Provides Twinner information for the vehicle.</p>
      </td>
      <td class="propExample"><p></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-upholsterycolor"><p>upholsteryColor</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Basic color of vehicle’s interior. Used to enable search by basic interior color.</p>
        <p>Allowed values can be retrieved via the references API (reference type InteriorColor)</p>
      </td>
      <td class="propExample"><p><code>1</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-upholsterytype"><p>upholsteryType</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>The type of upholstery the vehicle has</p>
        <p>Allowed values can be retrieved via the references API (reference type Upholstery)</p>
      </td>
      <td class="propExample"><p><code>AL</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-vehicletype"><p>vehicleType</p></td>
      <td class="propType"><p><a href="#/data-models?id=vehicletypeid">VehicleTypeId</a></p></td><td class="propMandatory"><p>Yes</p></td>      <td class="propConstraints">
        <ul>
          <li>Mandatory for all listings</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>The type of vehicle being listed.</p>
      </td>
      <td class="propExample"><p></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-vin"><p>vin</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. length: <code>17</code></li>
          <li class="numeric">Max. length: <code>17</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Vehicle Identification Number. A unique international code including a serial number used to identify individual motor vehicles, towed vehicles and motorcycles</p>
      </td>
      <td class="propExample"><p><code>AB023475861123745</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-warranty"><p>warranty</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>0</code></li>
          <li class="numeric">Max. value: <code>999</code></li>
          <li>This attribute only applies for customers that are dealers.</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Specifies the length in months of an additional warranty that is offered by the dealer.</p>
        <p>This warranty must be included in the vehicle price.</p>
        <p>If this field is not set, no warranty is provided</p>
      </td>
      <td class="propExample"><p><code>12</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-warrantyunit"><p>warrantyUnit</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li>This attribute only applies for customers that are dealers.</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Unit used for warranty field.</p>
      </td>
      <td class="propExample"><p><code>Months</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-wascaborrental"><p>wasCabOrRental</p></td>
      <td class="propType"><p>boolean</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Whether the vehicle has been used as cab or rental car or driving school car.</p>
      </td>
      <td class="propExample"><p><code>false</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-wastetankcapacity"><p>wasteTankCapacity</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>0</code></li>
          <li class="numeric">Max. value: <code>10000</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Waste tank capacity in liters.</p>
      </td>
      <td class="propExample"><p><code>100</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-wastetankcapacitymilliliters"><p>wasteTankCapacityMilliliters</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>0</code></li>
          <li class="numeric">Max. value: <code>10000000</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Waste tank capacity in milliliters.</p>
      </td>
      <td class="propExample"><p><code>100000</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-watertankcapacity"><p>waterTankCapacity</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>0</code></li>
          <li class="numeric">Max. value: <code>1000</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Water tank capacity in liters.</p>
      </td>
      <td class="propExample"><p><code>150</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-watertankcapacitymilliliters"><p>waterTankCapacityMilliliters</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>0</code></li>
          <li class="numeric">Max. value: <code>1000000</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Water tank capacity in milliliters.</p>
      </td>
      <td class="propExample"><p><code>150000</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-wheelbase"><p>wheelbase</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>1</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>The distance between the centers of the front and rear wheels, measured in millimeters.</p>
      </td>
      <td class="propExample"><p><code>2800</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-wheelbaseunit"><p>wheelbaseUnit</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Unit used for wheelbase field.</p>
      </td>
      <td class="propExample"><p><code>mm</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-wltp"><p>wltp</p></td>
      <td class="propType"><p><a href="#/data-models?id=wltpcommon">WltpCommon</a></p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Provides WLTP consumption information.</p>
      </td>
      <td class="propExample"><p></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listing-youtubevideourl"><p>youtubeVideoUrl</p></td>
      <td class="propType"><p>url</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. length: <code>1</code></li>
          <li class="numeric">Max. length: <code>256</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Youtube video for the vehicle.</p>
      </td>
      <td class="propExample"><p><code>https://www.youtube.com/watch?v=wnKJnWRa_Ks</code></p></td>
    </tr>

  </tbody>
</table>


## ListingBoost
<table>
  <tbody>
    <tr>
      <th>Field name</th>
      <th>Type</th><th>Mandatory</th> <th>Other constraints</th>
      <th>Description</th>
      <th>Example</th>
    </tr>    <tr>
      <td class="propName" id="data-models-property-listingboost-applied"><p>applied</p></td>
      <td class="propType"><p>boolean</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Indicates whether the ListingBoost is applied.</p>
        <p>Returns TRUE if the ListingBoost is applied, or FALSE/NULL if the ListingBoost is not applied.</p>
      </td>
      <td class="propExample"><p><code>false</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingboost-requested"><p>requested</p></td>
      <td class="propType"><p>boolean</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Indicates whether the ListingBoost is requested.</p>
        <p>Should be set to TRUE if a ListingBoost is requested to apply, FALSE if it is requested to be removed, or NULL if no change is needed.</p>
      </td>
      <td class="propExample"><p><code>false</code></p></td>
    </tr>

  </tbody>
</table>


## ListingBoostPayload
<table>
  <tbody>
    <tr>
      <th>Field name</th>
      <th>Type</th><th>Mandatory</th> <th>Other constraints</th>
      <th>Description</th>
      <th>Example</th>
    </tr>    <tr>
      <td class="propName" id="data-models-property-listingboostpayload-requested"><p>requested</p></td>
      <td class="propType"><p>boolean</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Indicates whether the ListingBoost is requested.</p>
        <p>Should be set to TRUE if a ListingBoost is requested to apply, FALSE if it is requested to be removed, or NULL/unspecified if no change on allocation is needed.</p>
      </td>
      <td class="propExample"><p><code>false</code></p></td>
    </tr>

  </tbody>
</table>


## ListingPayload
<table>
  <tbody>
    <tr>
      <th>Field name</th>
      <th>Type</th> <th>Other constraints</th>
      <th>Description</th>
      <th>Example</th>
    </tr>    <tr>
      <td class="propName" id="data-models-property-listingpayload-additionalfueltypes"><p>additionalFuelTypes</p></td>
      <td class="propType"><p>array[integer]</p></td>      <td class="propConstraints">
        <ul>
          <li>Items must be unique</li>
          <li>Forbidden for vehicleType <code>L</code> (trailer)</li>
          <li>Optional for vehicleType  <code>C</code> (Car), <code>X</code> (light commercial vehicle), <code>B</code> (bikes), <code>N</code> (caravan/mobile home)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Additional supported fuel types that might accompany the primary fuel type.</p>
        <p>These fuel types can also be consumed by the vehicle but have higher emissions than the primary fuel type.</p>
        <p>This is derived from German emission/consumption regulations for vehicles (EnVKV).</p>
      </td>
      <td class="propExample"><p></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingpayload-alloywheelsize"><p>alloyWheelSize</p></td>
      <td class="propType"><p>integer</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>10</code></li>
          <li class="numeric">Max. value: <code>26</code></li>
          <li class="numeric">Min. value: <code>10</code></li>
          <li class="numeric">Max. value: <code>26</code></li>
          <li>This property can only be specified if the equipment <code>15 "Alloy Wheels"</code> is set in the equipment property.</li>
          <li>Forbidden for vehicleType <code>A</code> (agricultural), <code>E</code> (heavy equipment), <code>O</code> (boat), <code>W</code> (personal watercraft) and <code>S</code> (snowmobile)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Size of alloy wheels of the vehicle (in inches).</p>
      </td>
      <td class="propExample"><p><code>18</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingpayload-auxiliarypower"><p>auxiliaryPower</p></td>
      <td class="propType"><p>string</p></td>      <td class="propConstraints">
        <ul>
          <li>Allowed values can be retrieved via the references API (reference type FuelCategory)</li>
          <li>Forbidden for vehicleType <code>C</code> (car), <code>B</code> (bike), <code>X</code> (light commercial vehicle), <code>N</code> (caravan/mobile home), <code>L</code> (trailer), <code>A</code> (agricultural), <code>E</code> (heavy equipment), <code>W</code> (personal watercraft) and <code>S</code> (snowmobile)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Auxiliary power source type.</p>
      </td>
      <td class="propExample"><p><code>B</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingpayload-availability"><p>availability</p></td>
      <td class="propType"><p><a href="#/data-models?id=availability">Availability</a></p></td>      <td class="propConstraints">
        <ul>
          <li>Mandatory for all listings</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Provides information about when the vehicle is available.</p>
      </td>
      <td class="propExample"><p></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingpayload-axlecount"><p>axleCount</p></td>
      <td class="propType"><p>integer</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>1</code></li>
          <li class="numeric">Max. value: <code>6</code></li>
          <li class="numeric">Min. value: <code>1</code></li>
          <li class="numeric">Max. value: <code>6</code></li>
          <li>Forbidden for vehicleType <code>C</code> (car), <code>B</code> (bike), <code>O</code> (boat), <code>W</code> (personal watercraft) and <code>S</code> (snowmobile)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>The number of axles the vehicle has.</p>
      </td>
      <td class="propExample"><p><code>1</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingpayload-axlespread"><p>axleSpread</p></td>
      <td class="propType"><p>integer</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>1</code></li>
          <li class="numeric">Max. value: <code>10000</code></li>
          <li>Forbidden for vehicleType <code>C</code> (car), <code>B</code> (bike), <code>N</code> (caravan/mobile home), <code>O</code> (boat), <code>W</code> (personal watercraft) and <code>S</code> (snowmobile)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Distance between left and right wheel for the rear axles.</p>
      </td>
      <td class="propExample"><p><code>5000</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingpayload-battery"><p>battery</p></td>
      <td class="propType"><p><a href="#/data-models?id=batterypayload">BatteryPayload</a></p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Information about the vehicle's battery</p>
      </td>
      <td class="propExample"><p></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingpayload-bedcount"><p>bedCount</p></td>
      <td class="propType"><p>integer</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>0</code></li>
          <li class="numeric">Max. value: <code>9</code></li>
          <li class="numeric">Min. value: <code>0</code></li>
          <li class="numeric">Max. value: <code>9</code></li>
          <li>Forbidden for vehicleType <code>C</code> (car), <code>B</code> (bike), <code>X</code> (light commercial vehicle), <code>L</code> (trailer), <code>A</code> (agricultural), <code>E</code> (heavy equipment), <code>W</code> (personal watercraft) and <code>S</code> (snowmobile)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Total number of beds.</p>
      </td>
      <td class="propExample"><p><code>4</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingpayload-belgiancarpassmileageurl"><p>belgianCarpassMileageUrl</p></td>
      <td class="propType"><p>url</p></td>      <td class="propConstraints">
        <ul>
          <li>Forbidden for vehicleType <code>L</code> (trailer), <code>O</code> (boat), <code>W</code> (personal watercraft) and <code>S</code> (snowmobile)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>The URL for the Carpass technical inspection for the listed vehicle</p>
      </td>
      <td class="propExample"><p><code>https://public.car-pass.be/vhr/2a0f0719-1b7a-4e42-84e1-c5c746ab1c39</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingpayload-bodycolor"><p>bodyColor</p></td>
      <td class="propType"><p>integer</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Basic body color of the vehicle.</p>
      </td>
      <td class="propExample"><p><code>2</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingpayload-bodycolorname"><p>bodyColorName</p></td>
      <td class="propType"><p>string</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. length: <code>1</code></li>
          <li class="numeric">Max. length: <code>30</code></li>
          <li>Emails are forbidden in the content</li>
          <li>Forbidden characters are<code>&lt;</code> or <code>&gt;</code></li>
          <li>Strings longer than 30 characters are accepted by the API but will be truncated to 30 characters.</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Manufacturers name of body color.</p>
      </td>
      <td class="propExample"><p><code>British Racing Green</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingpayload-bodytype"><p>bodyType</p></td>
      <td class="propType"><p>integer</p></td>      <td class="propConstraints">
        <ul>
          <li>Allowed values can be retrieved via the references API (reference type BodyType)</li>
          <li>Valid values for this reference type are dependent on the marketplace country of the customers.</li>
          <li>Mandatory for all listings (except vehicleType <code>S</code> (Snowmobile) where it is forbidden)</li>
          <li>Mandatory for vehicleType <code>C</code> (car), <code>B</code> (bike), <code>X</code> (light commercial vehicle), <code>N</code> (caravan/mobile home), <code>L</code> (trailer), <code>A</code> (agricultural), <code>E</code> (heavy equipment), <code>O</code> (boat) and <code>W</code> (personal watercraft)</li>
          <li>Forbidden for vehicleType <code>S</code> (snowmobile)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Shape of vehicle’s body.</p>
      </td>
      <td class="propExample"><p><code>1</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingpayload-braketype"><p>brakeType</p></td>
      <td class="propType"><p>string</p></td>      <td class="propConstraints">
        <ul>
          <li>Allowed values can be retrieved via the references API (reference type BrakeType)</li>
          <li>Forbidden for vehicleType <code>C</code> (car), <code>B</code> (bike), <code>N</code> (caravan/mobile home), <code>O</code> (boat), <code>W</code> (personal watercraft) and <code>S</code> (snowmobile)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Type of brakes.</p>
      </td>
      <td class="propExample"><p><code>A</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingpayload-cabinaxledistance"><p>cabinAxleDistance</p></td>
      <td class="propType"><p>integer</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>1</code></li>
          <li class="numeric">Max. value: <code>10000</code></li>
          <li class="numeric">Min. value: <code>1</code></li>
          <li class="numeric">Max. value: <code>10000</code></li>
          <li>Forbidden for vehicleType <code>C</code> (car), <code>B</code> (bike), <code>N</code> (caravan/mobile home), <code>L</code> (trailer), <code>A</code> (agricultural), <code>E</code> (heavy equipment), <code>O</code> (boat), <code>W</code> (personal watercraft) and <code>S</code> (snowmobile)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Distance between end of the cabin to the center of the rear axle group in mm.</p>
      </td>
      <td class="propExample"><p><code>3500</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingpayload-chassisbedlength"><p>chassisBedLength</p></td>
      <td class="propType"><p>string</p></td>      <td class="propConstraints">
        <ul>
          <li>Allowed values can be retrieved via the references API (reference type BedType)</li>
          <li>Forbidden for vehicleType <code>C</code> (car), <code>B</code> (bike), <code>X</code> (light commercial vehicle), <code>L</code> (trailer), <code>A</code> (agricultural), <code>E</code> (heavy equipment), <code>O</code> (boat), <code>W</code> (personal watercraft) and <code>S</code> (snowmobile)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Chassis bed length.</p>
      </td>
      <td class="propExample"><p><code>L</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingpayload-chassismanufacturername"><p>chassisManufacturerName</p></td>
      <td class="propType"><p>string</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Max. length: <code>100</code></li>
          <li class="numeric">Max. length: <code>100</code></li>
          <li>Forbidden for vehicleType <code>C</code> (car), <code>B</code> (bike), <code>X</code> (light commercial vehicle), <code>L</code> (trailer), <code>A</code> (agricultural), <code>E</code> (heavy equipment), <code>O</code> (boat), <code>W</code> (personal watercraft) and <code>S</code> (snowmobile)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>The manufacturer of the chassis.</p>
      </td>
      <td class="propExample"><p><code>Ford</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingpayload-co2emissions"><p>co2Emissions</p></td>
      <td class="propType"><p>integer</p></td>      <td class="propConstraints">
        <ul>
          <li>*Deprecated, use <code>wltp.co2EmissionsCombined</code> or <code>wltp.co2EmissionsCombinedWeighted</code> instead*</li>
          <li>Mandatory and not smaller than 1 for German dealers when the car is considered new (<code>mileage</code> <= 1000)</li>
          <li>Forbidden for vehicleType <code>L</code> (trailer)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Vehicle’s carbon dioxide emission in g/km.</p>
      </td>
      <td class="propExample"><p><code>23</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingpayload-condition"><p>condition</p></td>
      <td class="propType"><p><a href="#/data-models?id=condition">Condition</a></p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Describes the current condition of the vehicle</p>
      </td>
      <td class="propExample"><p></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingpayload-consumption"><p>consumption</p></td>
      <td class="propType"><p><a href="#/data-models?id=consumption">Consumption</a></p></td>      <td class="propConstraints">
        <ul>
          <li>*Deprecated, use <code>wltp.consumptionCombined</code> or <code>wltp.consumptionCombinedWeighted</code> instead*</li>
          <li>Forbidden for vehicleType <code>L</code> (trailer)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Provides fuel and electric consumption information for the vehicle.</p>
      </td>
      <td class="propExample"><p></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingpayload-costmodel"><p>costModel</p></td>
      <td class="propType"><p><a href="#/data-models?id=costmodelpayload">CostModelPayload</a></p></td>      <td class="propConstraints">
        <ul>
          <li>This attribute only applies for customers that are dealers.</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Provides information about the costs associated with the vehicle.</p>
      </td>
      <td class="propExample"><p></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingpayload-countryversion"><p>countryVersion</p></td>
      <td class="propType"><p>string</p></td>      <td class="propConstraints">
        <ul>
          <li>Allowed values can be retrieved via the references API (reference type Country)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Indicates the original market/country the vehicle was built for.</p>
      </td>
      <td class="propExample"><p><code>AT</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingpayload-crossreferenceid"><p>crossReferenceId</p></td>
      <td class="propType"><p>string</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. length: <code>1</code></li>
          <li class="numeric">Max. length: <code>50</code></li>
          <li>URLs are forbidden in the content</li>
          <li>Emails are forbidden in the content</li>
          <li>Forbidden characters are<code>&lt;</code> or <code>&gt;</code></li>
          <li>This attribute only applies for customers that are dealers.</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>A reference that can be used when managing or identifying listings.</p>
        <p>This information will not be shown on the AutoScout24 platform.</p>
      </td>
      <td class="propExample"><p><code>DATX_002</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingpayload-cylindercapacity"><p>cylinderCapacity</p></td>
      <td class="propType"><p>integer</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>1</code></li>
          <li class="numeric">Max. value: <code>99999</code></li>
          <li>Forbidden for vehicleType <code>L</code> (trailer)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Volume of the engines cylinders in cubic centimeters.</p>
      </td>
      <td class="propExample"><p><code>1998</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingpayload-cylindercount"><p>cylinderCount</p></td>
      <td class="propType"><p>integer</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>1</code></li>
          <li class="numeric">Max. value: <code>99</code></li>
          <li>Forbidden for vehicleType <code>L</code> (trailer)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>The number of cylinders of the engine.</p>
      </td>
      <td class="propExample"><p><code>4</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingpayload-description"><p>description</p></td>
      <td class="propType"><p>string</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Max. length: <code>10000</code></li>
          <li>Text may be formatted by tags. The following tags are supported:</li>
          <li>Line break: <code>\n</code> equivalent to HTML's <code>&lt;br&gt;</code>.</li>
          <li>Horizontal line: <code>----</code>  equivalent to HTML's <code>&lt;hr&gt;</code> and always accompanied by an automatic line break.</li>
          <li>Bold: <code>**lorem ipsum**</code> equivalent to HTML's <code>&lt;b&gt;lorem ipsum&lt;/b&gt;</code></li>
          <li>Bulleted list: <code>\\\\* lorem \\\\* ipsum</code></li>
          <li>Note that the first 10000 characters are displayed. Generally 1 character is equal to 1 byte but characters from the extended alphabet like “ä” count as 2 bytes.</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Free text description of the vehicle.</p>
      </td>
      <td class="propExample"><p><code>This car is **great**. ---- It has the following features: \n \\\\* Low price \\\\* Great interior
</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingpayload-differentialratio"><p>differentialRatio</p></td>
      <td class="propType"><p>double</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>0.01</code></li>
          <li class="numeric">Max. value: <code>100</code></li>
          <li>Forbidden for vehicleType <code>C</code> (car), <code>B</code> (bike), <code>N</code> (caravan/mobile home), <code>O</code> (boat), <code>W</code> (personal watercraft) and <code>S</code> (snowmobile)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Differential ratio with precision 4 and scale 2. Ratio between driveshaft and wheel rotation. </p>
      </td>
      <td class="propExample"><p><code>3.73</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingpayload-doorcount"><p>doorCount</p></td>
      <td class="propType"><p>integer</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>1</code></li>
          <li class="numeric">Max. value: <code>9</code></li>
          <li>Forbidden for vehicleType <code>O</code> (boat), <code>W</code> (personal watercraft) and <code>S</code> (snowmobile)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Number of doors the vehicle has</p>
      </td>
      <td class="propExample"><p><code>5</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingpayload-drivetrain"><p>drivetrain</p></td>
      <td class="propType"><p>string</p></td>      <td class="propConstraints">
        <ul>
          <li>Allowed values can be retrieved via the references API (reference type DriveType)</li>
          <li>Forbidden for vehicleType <code>L</code> (trailer)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Drive type of the vehicle.</p>
      </td>
      <td class="propExample"><p><code>R</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingpayload-drivingmode"><p>drivingMode</p></td>
      <td class="propType"><p>string</p></td>      <td class="propConstraints">
        <ul>
          <li>Allowed values are: <code>ChainDrive</code>, <code>BeltDrive</code>, <code>CrankDrive</code></li>
          <li>Forbidden for vehicleType <code>C</code> (car), <code>X</code> (light commercial vehicle), <code>N</code> (caravan/mobile home) and <code>L</code> (trailer)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>The drive type of the bike. Possible values are ChainDrive, BeltDrive, CrankDrive.</p>
      </td>
      <td class="propExample"><p><code>ChainDrive</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingpayload-ecode"><p>eCode</p></td>
      <td class="propType"><p>string</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. length: <code>15</code></li>
          <li class="numeric">Max. length: <code>15</code></li>
          <li class="numeric">Min. length: <code>15</code></li>
          <li class="numeric">Max. length: <code>15</code></li>
          <li>It should begins with "01" or "02" or "03" or "04" or "05"</li>
          <li>All characters should be numeric</li>
          <li>It is not allowed for vehicleType <code>L</code> (trailer)</li>
          <li>Forbidden for vehicleType <code>O</code> (boat), <code>W</code> (personal watercraft) and <code>S</code> (snowmobile)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Classification of makes and models given by data vendor DAT</p>
      </td>
      <td class="propExample"><p><code>010200020100001</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingpayload-efficiencyclass"><p>efficiencyClass</p></td>
      <td class="propType"><p>integer</p></td>      <td class="propConstraints">
        <ul>
          <li>*Deprecated, use <code>wltp.co2Class</code> instead*</li>
          <li>Allowed values can be retrieved via the references API (reference type EfficiencyClass)</li>
          <li>Mandatory for German dealers when vehicleType is <code>C</code> and the car is considered new (<code>mileage</code> <= 1000 and <code>firstRegistrationDate</code> <= 8 months).</li>
          <li>Forbidden for vehicleType <code>B</code> (bike), <code>L</code> (trailer), <code>O</code> (boat), <code>W</code> (personal watercraft) and <code>S</code> (snowmobile)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Vehicle’s energy efficiency class.</p>
      </td>
      <td class="propExample"><p><code>2</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingpayload-electricrange"><p>electricRange</p></td>
      <td class="propType"><p>integer</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>1</code></li>
          <li class="numeric">Max. value: <code>10000</code></li>
          <li>Mandatory for German dealers when the consumption values are WLTP and the vehicle type is <code>C</code> (Car), <code>primaryFuelType</code> is <code>12</code> (electric / PHEV / EV) and the car is considered new (<code>mileage</code> <= 1000 and <code>firstRegistrationDate</code> <= 8 months).</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>The electric range of the vehicle in kilometers according to WLTP. (EAER)</p>
      </td>
      <td class="propExample"><p><code>620</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingpayload-electricrangecity"><p>electricRangeCity</p></td>
      <td class="propType"><p>integer</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>1</code></li>
          <li class="numeric">Max. value: <code>10000</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>The electric range of the vehicle in kilometers according to WLTP measured in cities. (EAER city)</p>
      </td>
      <td class="propExample"><p><code>410</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingpayload-emptyweight"><p>emptyWeight</p></td>
      <td class="propType"><p>integer</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>1</code></li>
          <li class="numeric">Max. value: <code>99999</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Vehicle’s weight without driver, passengers or liquids (like fuel) in kg.</p>
      </td>
      <td class="propExample"><p><code>1200</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingpayload-emptyweightgrams"><p>emptyWeightGrams</p></td>
      <td class="propType"><p>integer</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>1000</code></li>
          <li class="numeric">Max. value: <code>99999000</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Vehicle’s weight without driver, passengers or liquids (like fuel) in grams.</p>
        <p>Use this field instead of emptyWeight when submitting values in imperial units (lbs) to avoid rounding loss.</p>
      </td>
      <td class="propExample"><p><code>1200000</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingpayload-enginecoolingsystem"><p>engineCoolingSystem</p></td>
      <td class="propType"><p>string</p></td>      <td class="propConstraints">
        <ul>
          <li>Allowed values can be retrieved via the references API (reference type EngineCoolingSystem)</li>
          <li>Forbidden for vehicleType <code>C</code> (car), <code>X</code> (light commercial vehicle), <code>N</code> (caravan/mobile home), <code>L</code> (trailer), <code>A</code> (agricultural), <code>E</code> (heavy equipment), <code>O</code> (boat) and <code>W</code> (personal watercraft)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Engine cooling system type.</p>
      </td>
      <td class="propExample"><p><code>O</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingpayload-enginecount"><p>engineCount</p></td>
      <td class="propType"><p>integer</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>0</code></li>
          <li class="numeric">Max. value: <code>10</code></li>
          <li>Forbidden for vehicleType <code>C</code> (car), <code>B</code> (bike), <code>X</code> (light commercial vehicle), <code>N</code> (caravan/mobile home), <code>L</code> (trailer), <code>A</code> (agricultural), <code>E</code> (heavy equipment), <code>W</code> (personal watercraft) and <code>S</code> (snowmobile)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Number of engines.</p>
      </td>
      <td class="propExample"><p><code>2</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingpayload-enginehours"><p>engineHours</p></td>
      <td class="propType"><p>integer</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>0</code></li>
          <li class="numeric">Max. value: <code>1000000</code></li>
          <li>Forbidden for vehicleType <code>C</code> (car), <code>N</code> (caravan/mobile home) and <code>S</code> (snowmobile)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Engine operating hours.</p>
      </td>
      <td class="propExample"><p><code>1500</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingpayload-enginemanufacturername"><p>engineManufacturerName</p></td>
      <td class="propType"><p>string</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Max. length: <code>200</code></li>
          <li>Forbidden for vehicleType <code>C</code> (car), <code>B</code> (bike), <code>X</code> (light commercial vehicle), <code>L</code> (trailer), <code>A</code> (agricultural), <code>E</code> (heavy equipment), <code>W</code> (personal watercraft) and <code>S</code> (snowmobile)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Engine manufacturer name.</p>
      </td>
      <td class="propExample"><p><code>Yamaha</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingpayload-enginemountingtype"><p>engineMountingType</p></td>
      <td class="propType"><p>string</p></td>      <td class="propConstraints">
        <ul>
          <li>Allowed values can be retrieved via the references API (reference type EngineMountingType)</li>
          <li>Forbidden for vehicleType <code>C</code> (car), <code>B</code> (bike), <code>X</code> (light commercial vehicle), <code>N</code> (caravan/mobile home), <code>L</code> (trailer), <code>A</code> (agricultural), <code>E</code> (heavy equipment), <code>W</code> (personal watercraft) and <code>S</code> (snowmobile)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Engine mounting type.</p>
      </td>
      <td class="propExample"><p><code>S</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingpayload-equipment"><p>equipment</p></td>
      <td class="propType"><p>array[integer]</p></td>      <td class="propConstraints">
        <ul>
          <li>Items must be unique</li>
          <li>Allowed values can be retrieved via the references API (reference type equipment)</li>
          <li>You are only allowed to send one Automatic Climate Control equipment for a given listing. Automatic climate control equipments include: (241) Automatic climate control 2 zones, (242) Automatic climate control 3 zones, (243) Automatic climate control, 4 zones and (30) Automatic climate control. If the vehicle has Automatic Climate Control but the number of zones is unknown, use (30) Automatic climate control.</li>
          <li>If the vehicle has a sliding door, but the side which the door is on is unknown use equipment (152) Sliding Door. If the side is known use (244) Sliding Door left, (245) Sliding Door right or both (if there are sliding doors on both sides). You are not allowed to send (152) sliding door, and (244)/(245) at the same time.</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>List of vehicle’s equipment.</p>
      </td>
      <td class="propExample"><p></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingpayload-euemissionstandard"><p>euEmissionStandard</p></td>
      <td class="propType"><p>string</p></td>      <td class="propConstraints">
        <ul>
          <li>Allowed values can be retrieved via the references API (reference type EuEmissionStandard)</li>
          <li>Forbidden for vehicleType <code>L</code> (trailer), <code>O</code> (boat), <code>W</code> (personal watercraft) and <code>S</code> (snowmobile)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>The EU emission standard indicates the amount of harmful substances the vehicle emits.</p>
        <p>The classification is in accordance with the European Standard Euronorm</p>
      </td>
      <td class="propExample"><p><code>1</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingpayload-europalletstoragespaces"><p>europalletStorageSpaces</p></td>
      <td class="propType"><p>integer</p></td>      <td class="propConstraints">
        <ul>
          <li>Forbidden for vehicleType <code>C</code> (car), <code>B</code> (bike), <code>N</code> (caravan/mobile home), <code>A</code> (agricultural), <code>O</code> (boat), <code>W</code> (personal watercraft) and <code>S</code> (snowmobile)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>The number of europallets that can be transported by the vehicle.</p>
      </td>
      <td class="propExample"><p><code>5</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingpayload-extendedlength"><p>extendedLength</p></td>
      <td class="propType"><p>integer</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>1</code></li>
          <li class="numeric">Max. value: <code>50000</code></li>
          <li>Forbidden for vehicleType <code>C</code> (car), <code>B</code> (bike), <code>X</code> (light commercial vehicle), <code>L</code> (trailer), <code>A</code> (agricultural), <code>E</code> (heavy equipment), <code>O</code> (boat), <code>W</code> (personal watercraft) and <code>S</code> (snowmobile)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Extended length in millimeters.</p>
      </td>
      <td class="propExample"><p><code>8000</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingpayload-exteriormaterial"><p>exteriorMaterial</p></td>
      <td class="propType"><p>string</p></td>      <td class="propConstraints">
        <ul>
          <li>Allowed values can be retrieved via the references API (reference type ExteriorMaterial)</li>
          <li>Forbidden for vehicleType <code>C</code> (car), <code>B</code> (bike), <code>X</code> (light commercial vehicle), <code>L</code> (trailer), <code>A</code> (agricultural), <code>E</code> (heavy equipment), <code>O</code> (boat), <code>W</code> (personal watercraft) and <code>S</code> (snowmobile)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Exterior material type.</p>
      </td>
      <td class="propExample"><p><code>S</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingpayload-externalcustomerid"><p>externalCustomerId</p></td>
      <td class="propType"><p>string</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>A customer id belonging to an external system.</p>
      </td>
      <td class="propExample"><p><code>1</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingpayload-financingoffer"><p>financingOffer</p></td>
      <td class="propType"><p><a href="#/data-models?id=financingofferpayload">FinancingOfferPayload</a></p></td>      <td class="propConstraints">
        <ul>
          <li>This attribute only applies for customers that are dealers.</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Allows a dealer to offer financing when selling the vehicle.</p>
        <p>The financing offer will only be shown if the dealer has a contract to use this feature</p>
      </td>
      <td class="propExample"><p></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingpayload-firstmodelsproductiondate"><p>firstModelsProductionDate</p></td>
      <td class="propType"><p>year-month</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>The date in which the first models of this vehicle were produced</p>
      </td>
      <td class="propExample"><p><code>2015-02</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingpayload-firstregistrationdate"><p>firstRegistrationDate</p></td>
      <td class="propType"><p>year-month</p></td>      <td class="propConstraints">
        <ul>
          <li>Mandatory for vehicleType <code>C</code> (car), <code>B</code> (Bike), <code>X</code> (light commercial vehicle) where offerType is  <code>J</code> (employee’s car), <code>O</code> (antique/classic), <code>S</code> (pre-registered), <code>U</code> (used)</li>
          <li>Must not be more than 24 months in the past  when vehicleType is <code>C</code> (car) and offerType = <code>J</code> (employee’s car)</li>
          <li>Must not be more than 12 months in the past when vehicleType is <code>C</code> (car) and OfferType = <code>S</code> (pre-registered).  This rule does not apply to Italian dealers</li>
          <li>Must be greater than 360 months (30 years) when vehicleType is <code>C</code> (car) and offerType is <code>O</code> (antique/classic)</li>
          <li>Must not be a date from the future set when OfferType = <code>J</code> (annual car) or OfferType = <code>O</code> (old timer).</li>
          <li>Note: Must not be less than <code>1886</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Month and year of first registration of the vehicle.</p>
      </td>
      <td class="propExample"><p><code>2015-01</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingpayload-flooringmaterial"><p>flooringMaterial</p></td>
      <td class="propType"><p>string</p></td>      <td class="propConstraints">
        <ul>
          <li>Allowed values can be retrieved via the references API (reference type Flooring)</li>
          <li>Forbidden for vehicleType <code>C</code> (car), <code>B</code> (bike), <code>X</code> (light commercial vehicle), <code>L</code> (trailer), <code>A</code> (agricultural), <code>E</code> (heavy equipment), <code>O</code> (boat), <code>W</code> (personal watercraft) and <code>S</code> (snowmobile)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Flooring material type.</p>
      </td>
      <td class="propExample"><p><code>S</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingpayload-fridgecapacity"><p>fridgeCapacity</p></td>
      <td class="propType"><p>integer</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>1</code></li>
          <li class="numeric">Max. value: <code>1000</code></li>
          <li>Forbidden for vehicleType <code>C</code> (car), <code>B</code> (bike), <code>X</code> (light commercial vehicle), <code>L</code> (trailer), <code>A</code> (agricultural), <code>E</code> (heavy equipment), <code>O</code> (boat), <code>W</code> (personal watercraft) and <code>S</code> (snowmobile)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Fridge capacity in liters.</p>
      </td>
      <td class="propExample"><p><code>100</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingpayload-fridgecapacitymilliliters"><p>fridgeCapacityMilliliters</p></td>
      <td class="propType"><p>integer</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>1000</code></li>
          <li class="numeric">Max. value: <code>1000000</code></li>
          <li>Forbidden for vehicleType <code>C</code> (car), <code>B</code> (bike), <code>X</code> (light commercial vehicle), <code>L</code> (trailer), <code>A</code> (agricultural), <code>E</code> (heavy equipment), <code>O</code> (boat), <code>W</code> (personal watercraft) and <code>S</code> (snowmobile)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Fridge capacity in milliliters.</p>
      </td>
      <td class="propExample"><p><code>100000</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingpayload-fridgepowertype"><p>fridgePowerType</p></td>
      <td class="propType"><p>string</p></td>      <td class="propConstraints">
        <ul>
          <li>Allowed values can be retrieved via the references API (reference type FridgePowerType)</li>
          <li>Forbidden for vehicleType <code>C</code> (car), <code>B</code> (bike), <code>X</code> (light commercial vehicle), <code>L</code> (trailer), <code>A</code> (agricultural), <code>E</code> (heavy equipment), <code>O</code> (boat), <code>W</code> (personal watercraft) and <code>S</code> (snowmobile)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Fridge power type.</p>
      </td>
      <td class="propExample"><p><code>E</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingpayload-frontaxleweightrating"><p>frontAxleWeightRating</p></td>
      <td class="propType"><p>integer</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>1</code></li>
          <li class="numeric">Max. value: <code>100000</code></li>
          <li>Forbidden for vehicleType <code>C</code> (car), <code>B</code> (bike), <code>N</code> (caravan/mobile home), <code>O</code> (boat), <code>W</code> (personal watercraft) and <code>S</code> (snowmobile)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Front axle weight rating in kilograms.</p>
      </td>
      <td class="propExample"><p><code>7500</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingpayload-frontaxleweightratinggrams"><p>frontAxleWeightRatingGrams</p></td>
      <td class="propType"><p>integer</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>1000</code></li>
          <li class="numeric">Max. value: <code>100000000</code></li>
          <li>Forbidden for vehicleType <code>C</code> (car), <code>B</code> (bike), <code>N</code> (caravan/mobile home), <code>O</code> (boat), <code>W</code> (personal watercraft) and <code>S</code> (snowmobile)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Front axle weight rating in grams.</p>
      </td>
      <td class="propExample"><p><code>7500000</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingpayload-fuelcapacity"><p>fuelCapacity</p></td>
      <td class="propType"><p>integer</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>1</code></li>
          <li class="numeric">Max. value: <code>1000</code></li>
          <li>Forbidden for vehicleType <code>C</code> (car), <code>B</code> (bike), <code>X</code> (light commercial vehicle), <code>N</code> (caravan/mobile home), <code>L</code> (trailer), <code>A</code> (agricultural), <code>E</code> (heavy equipment), <code>O</code> (boat) and <code>W</code> (personal watercraft)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Fuel capacity in liters.</p>
      </td>
      <td class="propExample"><p><code>200</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingpayload-fuelcapacitymilliliters"><p>fuelCapacityMilliliters</p></td>
      <td class="propType"><p>integer</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>1000</code></li>
          <li class="numeric">Max. value: <code>1000000</code></li>
          <li>Forbidden for vehicleType <code>C</code> (car), <code>B</code> (bike), <code>X</code> (light commercial vehicle), <code>N</code> (caravan/mobile home), <code>L</code> (trailer), <code>A</code> (agricultural), <code>E</code> (heavy equipment), <code>O</code> (boat) and <code>W</code> (personal watercraft)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Fuel capacity in milliliters.</p>
      </td>
      <td class="propExample"><p><code>200000</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingpayload-fuelcategory"><p>fuelCategory</p></td>
      <td class="propType"><p>string</p></td>      <td class="propConstraints">
        <ul>
          <li>Allowed values can be retrieved via the references API (reference type FuelCategory)</li>
          <li>Valid values for this reference type are dependent on the marketplace country of the customers.</li>
          <li>Forbidden for vehicleType <code>L</code> (trailer)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Category of fuel/energy source for the vehicle.</p>
      </td>
      <td class="propExample"><p><code>B</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingpayload-fueldeliverytype"><p>fuelDeliveryType</p></td>
      <td class="propType"><p>string</p></td>      <td class="propConstraints">
        <ul>
          <li>Allowed values can be retrieved via the references API (reference type FuelDeliveryType)</li>
          <li>Forbidden for vehicleType <code>C</code> (car), <code>X</code> (light commercial vehicle), <code>N</code> (caravan/mobile home), <code>L</code> (trailer), <code>A</code> (agricultural), <code>E</code> (heavy equipment), <code>O</code> (boat) and <code>W</code> (personal watercraft)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Fuel delivery type.</p>
      </td>
      <td class="propExample"><p><code>I</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingpayload-gearcount"><p>gearCount</p></td>
      <td class="propType"><p>integer</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>1</code></li>
          <li class="numeric">Max. value: <code>99</code></li>
          <li>Forbidden for vehicleType <code>L</code> (trailer)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Number of gears of the vehicle</p>
      </td>
      <td class="propExample"><p><code>6</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingpayload-germanemissionssticker"><p>germanEmissionsSticker</p></td>
      <td class="propType"><p>integer</p></td>      <td class="propConstraints">
        <ul>
          <li>Allowed values can be retrieved via the references API (reference type EmissionsSticker)</li>
          <li>Forbidden for vehicleType <code>B</code> (bike), <code>L</code> (trailer), <code>O</code> (boat), <code>W</code> (personal watercraft) and <code>S</code> (snowmobile)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Emissions sticker type as assigned by German technical inspection authorities (Umweltplakette/Feinstaubplakette).</p>
      </td>
      <td class="propExample"><p><code>1</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingpayload-grossvehicleweight"><p>grossVehicleWeight</p></td>
      <td class="propType"><p>integer</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>1</code></li>
          <li>Forbidden for vehicleType <code>C</code> (car) and <code>B</code> (bike)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>The maximum operating weight of a vehicle measured in kg, including its chassis, body, engine, engine fluids, fuel, accessories, driver, passengers and cargo</p>
      </td>
      <td class="propExample"><p><code>3500</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingpayload-grossvehicleweightgrams"><p>grossVehicleWeightGrams</p></td>
      <td class="propType"><p>integer</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>1000</code></li>
          <li>Forbidden for vehicleType <code>C</code> (car) and <code>B</code> (bike)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>The maximum operating weight of a vehicle in grams, including its chassis, body, engine, engine fluids, fuel, accessories, driver, passengers and cargo.</p>
        <p>Use this field instead of grossVehicleWeight when submitting values in imperial units (lbs) to avoid rounding loss.</p>
      </td>
      <td class="propExample"><p><code>3500000</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingpayload-hascarregistration"><p>hasCarRegistration</p></td>
      <td class="propType"><p>boolean</p></td>      <td class="propConstraints">
        <ul>
          <li>Forbidden for vehicleType <code>C</code> (car), <code>B</code> (bike), <code>L</code> (trailer), <code>O</code> (boat), <code>W</code> (personal watercraft) and <code>S</code> (snowmobile)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Indicates whether a vehicle is registered as a car in the registration documents</p>
      </td>
      <td class="propExample"><p><code>false</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingpayload-hasfullservicehistory"><p>hasFullServiceHistory</p></td>
      <td class="propType"><p>boolean</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Indicates whether vehicle has passed all periodic maintenance as recommended by the vehicle manufacturer.</p>
      </td>
      <td class="propExample"><p><code>false</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingpayload-hasparticlefilter"><p>hasParticleFilter</p></td>
      <td class="propType"><p>boolean</p></td>      <td class="propConstraints">
        <ul>
          <li>Forbidden for vehicleType <code>L</code> (trailer)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Indicates whether a diesel vehicle is equipped with a particle filter</p>
      </td>
      <td class="propExample"><p><code>true</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingpayload-haswarranty"><p>hasWarranty</p></td>
      <td class="propType"><p>boolean</p></td>      <td class="propConstraints">
        <ul>
          <li>This attribute only applies for customers that are dealers.</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Whether the vehicle has warranty.</p>
        <p>If warranty is set to 0 this can't be set to 'true'</p>
        <p>If warranty is set to > 0 this can't be set to 'false'</p>
      </td>
      <td class="propExample"><p><code>true</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingpayload-headcount"><p>headCount</p></td>
      <td class="propType"><p>integer</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>0</code></li>
          <li class="numeric">Max. value: <code>20</code></li>
          <li class="numeric">Min. value: <code>0</code></li>
          <li class="numeric">Max. value: <code>20</code></li>
          <li>Forbidden for vehicleType <code>C</code> (car), <code>B</code> (bike), <code>X</code> (light commercial vehicle), <code>N</code> (caravan/mobile home), <code>L</code> (trailer), <code>A</code> (agricultural), <code>E</code> (heavy equipment), <code>W</code> (personal watercraft) and <code>S</code> (snowmobile)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Total number of heads (bathrooms).</p>
      </td>
      <td class="propExample"><p><code>2</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingpayload-highlights"><p>highlights</p></td>
      <td class="propType"><p>array[<a href="#/data-models?id=highlight">Highlight</a>]</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Maximum number of items is 3</li>
          <li>This attribute only applies for customers that are dealers.</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Short notes highlighting key features of the vehicle</p>
        <p><strong>🚧 This functionality is currently under construction and will not be shown to Autoscout24 users</strong></p>
      </td>
      <td class="propExample"><p></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingpayload-hsn"><p>hsn</p></td>
      <td class="propType"><p>string</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. length: <code>4</code></li>
          <li class="numeric">Max. length: <code>4</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Herstellerschluesselnummer, or the unique identifier of vehicle manufacturer in Germany.</p>
        <p>In combination with TSN this key is used to uniquely identify a vehicle type.</p>
        <p>The make of a vehicle can be fully derived from this identifier.</p>
      </td>
      <td class="propExample"><p><code>0583</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingpayload-hullmaterial"><p>hullMaterial</p></td>
      <td class="propType"><p>string</p></td>      <td class="propConstraints">
        <ul>
          <li>Allowed values can be retrieved via the references API (reference type HullMaterial)</li>
          <li>Forbidden for vehicleType <code>C</code> (car), <code>B</code> (bike), <code>X</code> (light commercial vehicle), <code>N</code> (caravan/mobile home), <code>L</code> (trailer), <code>A</code> (agricultural), <code>E</code> (heavy equipment), <code>W</code> (personal watercraft) and <code>S</code> (snowmobile)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Hull material type.</p>
      </td>
      <td class="propExample"><p><code>S</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingpayload-images"><p>images</p></td>
      <td class="propType"><p>array[<a href="#/data-models?id=imagepayload">ImagePayload</a>]</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Maximum number of items is 50</li>
          <li>Items must be unique</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>The images to associate with this listing.</p>
        <p>It will fully replace the previous associated images.</p>
        <p>Orphan images will be deleted immediately after the operation.</p>
      </td>
      <td class="propExample"><p></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingpayload-images"><p>images</p></td>
      <td class="propType"><p>array[<a href="#/data-models?id=imagepayload">ImagePayload</a>]</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Maximum number of items is 50</li>
          <li>Items must be unique</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>The images to associate with this listing.</p>
        <p>It will fully replace the previous associated images.</p>
        <p>Orphan images will be deleted immediately after the operation.</p>
      </td>
      <td class="propExample"><p></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingpayload-includedservices"><p>includedServices</p></td>
      <td class="propType"><p>array[integer]</p></td>      <td class="propConstraints">
        <ul>
          <li>Items must be unique</li>
          <li>Allowed values can be retrieved via the references API (reference type IncludedService).</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Included services as part of the vehicle offer.</p>
        <p>Values <code>1</code> for German dealers (HU/AU) and <code>2</code> for Dutch dealers indicate that an inspection has been done recently and the vehicle is in a roadworthy state.</p>
      </td>
      <td class="propExample"><p></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingpayload-iseureimport"><p>isEUReimport</p></td>
      <td class="propType"><p>boolean</p></td>      <td class="propConstraints">
        <ul>
          <li>This attribute is only available for Smyle listings at the moment. Its value won't be considered valid and won't be displayed in the AutoScout24 websites. This is up to change in the future.</li>
          <li>Forbidden for vehicleType <code>O</code> (boat), <code>W</code> (personal watercraft) and <code>S</code> (snowmobile)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Whether the vehicle is EU reimported.</p>
      </td>
      <td class="propExample"><p><code>true</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingpayload-ismetallic"><p>isMetallic</p></td>
      <td class="propType"><p>boolean</p></td>      <td class="propConstraints">
        <ul>
          <li>Forbidden for vehicleType <code>L</code> (trailer)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Whether the vehicle’s body color has a metallic effect.</p>
      </td>
      <td class="propExample"><p><code>true</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingpayload-isnonsmoking"><p>isNonSmoking</p></td>
      <td class="propType"><p>boolean</p></td>      <td class="propConstraints">
        <ul>
          <li>Forbidden for vehicleType <code>L</code> (trailer) and <code>S</code> (snowmobile)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Whether the vehicle has been used by non-smokers only.</p>
      </td>
      <td class="propExample"><p><code>true</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingpayload-ispluginhybrid"><p>isPluginHybrid</p></td>
      <td class="propType"><p>boolean</p></td>      <td class="propConstraints">
        <ul>
          <li>If this property is set to <code>true</code>, then:</li>
          <li><code>primaryFuelType</code> OR <code>additionalFuelTypes</code> must contain <code>12</code> (Electric) AND <code>primaryFuelType</code> OR <code>additionalFuelTypes</code> must contain one fuel type != <code>12</code> (Electric)</li></li>
          <li><code>fuelCategory</code> must be one of <code>3</code> (Electric/Diesel), <code>2</code> (Electric/Benzin) or <code>O</code> Others</li></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Whether the vehicle is a plugin hybrid.</p>
      </td>
      <td class="propExample"><p><code>true</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingpayload-isreserved"><p>isReserved</p></td>
      <td class="propType"><p>boolean</p></td>      <td class="propConstraints">
        <ul>
          <li>This attribute is only available for Smyle listings at the moment. Its value won't be considered valid and won't be displayed in the AutoScout24 websites. This is up to change in the future.</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Whether the vehicle is reserved.</p>
      </td>
      <td class="propExample"><p><code>true</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingpayload-lastcambeltservicedate"><p>lastCamBeltServiceDate</p></td>
      <td class="propType"><p>year-month</p></td>      <td class="propConstraints">
        <ul>
          <li>Forbidden for vehicleType <code>L</code> (trailer)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Date of last cam belt exchange.</p>
        <p>Cannot be in the future.</p>
      </td>
      <td class="propExample"><p><code>2016-01</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingpayload-lasttechnicalservicedate"><p>lastTechnicalServiceDate</p></td>
      <td class="propType"><p>year-month</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Date of last periodic maintenance</p>
      </td>
      <td class="propExample"><p><code>2016-06</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingpayload-leasingoffers"><p>leasingOffers</p></td>
      <td class="propType"><p><a href="#/data-models?id=leasingofferspayload">LeasingOffersPayload</a></p></td>      <td class="propConstraints">
        <ul>
          <li>Not available for dealers outside germany. This attribute only applies for customers that are dealers.</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Allows a dealer to offer leasing when selling the vehicle.</p>
      </td>
      <td class="propExample"><p></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingpayload-licenceplate"><p>licencePlate</p></td>
      <td class="propType"><p>string</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. length: <code>1</code></li>
          <li class="numeric">Max. length: <code>10</code></li>
          <li>Emails are forbidden in the content</li>
          <li>Forbidden characters are<code>&lt;</code> or <code>&gt;</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Licence plate number of the vehicle</p>
      </td>
      <td class="propExample"><p><code>M-2411-DC</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingpayload-loadheight"><p>loadHeight</p></td>
      <td class="propType"><p>integer</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>1</code></li>
          <li class="numeric">Min. value: <code>1</code></li>
          <li>Forbidden for vehicleType <code>C</code> (car), <code>B</code> (bike), <code>N</code> (caravan/mobile home), <code>O</code> (boat), <code>W</code> (personal watercraft) and <code>S</code> (snowmobile)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Maximum height of the load in millimeters</p>
      </td>
      <td class="propExample"><p><code>1900</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingpayload-loadlength"><p>loadLength</p></td>
      <td class="propType"><p>integer</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>1</code></li>
          <li class="numeric">Min. value: <code>1</code></li>
          <li>Forbidden for vehicleType <code>C</code> (car), <code>B</code> (bike), <code>N</code> (caravan/mobile home), <code>O</code> (boat), <code>W</code> (personal watercraft) and <code>S</code> (snowmobile)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Maximum length of the load in millimeters</p>
      </td>
      <td class="propExample"><p><code>3800</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingpayload-loadvolume"><p>loadVolume</p></td>
      <td class="propType"><p>number</p></td>      <td class="propConstraints">
        <ul>
          <li>Forbidden for vehicleType <code>C</code> (car), <code>B</code> (bike), <code>N</code> (caravan/mobile home), <code>O</code> (boat), <code>W</code> (personal watercraft) and <code>S</code> (snowmobile)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Maximum volume of the load in cubic meters</p>
      </td>
      <td class="propExample"><p><code>5.5</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingpayload-loadwidth"><p>loadWidth</p></td>
      <td class="propType"><p>integer</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>1</code></li>
          <li class="numeric">Min. value: <code>1</code></li>
          <li>Forbidden for vehicleType <code>C</code> (car), <code>B</code> (bike), <code>N</code> (caravan/mobile home), <code>O</code> (boat), <code>W</code> (personal watercraft) and <code>S</code> (snowmobile)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Maximum width of the load in millimeters</p>
      </td>
      <td class="propExample"><p><code>2100</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingpayload-make"><p>make</p></td>
      <td class="propType"><p>integer</p></td>      <td class="propConstraints">
        <ul>
          <li>Allowed values can be retrieved via the makes API</li>
          <li>Mandatory for all listings</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Make identifier of the vehicle.</p>
      </td>
      <td class="propExample"><p><code>13</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingpayload-marketing"><p>marketing</p></td>
      <td class="propType"><p><a href="#/data-models?id=partialmarketingpayload">PartialMarketingPayload</a></p></td>      <td class="propConstraints">
        <ul>
          <li>This attribute only applies for customers that are dealers.</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Provides additional marketing information</p>
      </td>
      <td class="propExample"><p></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingpayload-marketing"><p>marketing</p></td>
      <td class="propType"><p><a href="#/data-models?id=marketingpayload">MarketingPayload</a></p></td>      <td class="propConstraints">
        <ul>
          <li>This attribute only applies for customers that are dealers.</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Provides additional marketing information</p>
      </td>
      <td class="propExample"><p></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingpayload-maximumtowingweight"><p>maximumTowingWeight</p></td>
      <td class="propType"><p>integer</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>1</code></li>
          <li class="numeric">Min. value: <code>1</code></li>
          <li>Forbidden for vehicleType <code>C</code> (car), <code>B</code> (bike), <code>L</code> (trailer), <code>O</code> (boat), <code>W</code> (personal watercraft) and <code>S</code> (snowmobile)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>The maximum weight the vehicle can tow in kg.</p>
      </td>
      <td class="propExample"><p><code>130</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingpayload-mileage"><p>mileage</p></td>
      <td class="propType"><p>integer</p></td>      <td class="propConstraints">
        <ul>
          <li>Mandatory, and must be greater or equal than 0 when offerType is <code>J</code> (employee’s car), <code>S</code> (pre-registered), <code>O</code> (antique/classic), <code>U</code> (used) when vehicleType is C (car), B (bike) or X (light commercial vehicle)</li>
          <li>Optional for vehicleType <code>N</code> (caravan/mobile home)</li>
          <li>Forbidden for vehicleType <code>L</code> (trailer)</li>
          <li>Mileage must be less than 1000 when offerType is <code>N</code> (new)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>The distance in kilometers that the vehicle has run.</p>
      </td>
      <td class="propExample"><p><code>75000</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingpayload-model"><p>model</p></td>
      <td class="propType"><p>integer</p></td>      <td class="propConstraints">
        <ul>
          <li>Allowed values can be retrieved via the makes API</li>
          <li>Mandatory for vehicleType <code>C</code> (car) and <code>B</code> (bike)</li>
          <li>Forbidden for vehicleType <code>X</code> (light commercial vehicle), <code>N</code> (caravan/mobile home), <code>L</code> (trailer), <code>A</code> (agricultural), <code>E</code> (heavy equipment), <code>O</code> (boat), <code>W</code> (personal watercraft) and <code>S</code> (snowmobile)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>The model of the vehicle (for cars and bikes)</p>
      </td>
      <td class="propExample"><p><code>1641</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingpayload-modelname"><p>modelName</p></td>
      <td class="propType"><p>string</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Max. length: <code>50</code></li>
          <li>Mandatory for vehicleType <code>X</code> (light commercial vehicle), <code>N</code> (caravan/mobile home), <code>L</code> (trailer), <code>A</code> (agricultural), <code>E</code> (heavy equipment), <code>O</code> (boat) and <code>W</code> (personal watercraft)</li>
          <li>Mandatory for vehicleType <code>X</code> (light commercial vehicle), <code>N</code> (caravan/mobile home), <code>L</code> (trailer), <code>A</code> (agricultural), <code>E</code> (heavy equipment), <code>O</code> (boat), <code>W</code> (personal watercraft) and <code>S</code> (snowmobile)</li>
          <li>Forbidden for vehicleType <code>C</code> (car) and <code>B</code> (bike)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>The model of the vehicle (for Light Commercial Vehicles, Trailers, Caravans/Mobile homes)</p>
      </td>
      <td class="propExample"><p><code>Sprinter 310 Carlsen</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingpayload-modelversion"><p>modelVersion</p></td>
      <td class="propType"><p>string</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. length: <code>1</code></li>
          <li class="numeric">Max. length: <code>121</code></li>
          <li>Emails are forbidden in the content</li>
          <li>Forbidden characters are<code>&lt;</code> or <code>&gt;</code></li>
          <li>Strings longer than 121 characters are accepted by the API but will be truncated to 121 characters.</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Additional information about the model.</p>
      </td>
      <td class="propExample"><p><code>Avant</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingpayload-natcode"><p>natCode</p></td>
      <td class="propType"><p>string</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Max. length: <code>22</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Classification of makes and models given by Eurotax/Schwacke</p>
      </td>
      <td class="propExample"><p><code>20239429</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingpayload-nextinspectiondate"><p>nextInspectionDate</p></td>
      <td class="propType"><p>year-month</p></td>      <td class="propConstraints">
        <ul>
          <li>Must be within the next 5 years, or in the past 5 years.</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Date of next technical inspection as required by regulations.</p>
      </td>
      <td class="propExample"><p><code>2028-01</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingpayload-offerreferenceid"><p>offerReferenceId</p></td>
      <td class="propType"><p>string</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. length: <code>1</code></li>
          <li class="numeric">Max. length: <code>50</code></li>
          <li>URLs are forbidden in the content</li>
          <li>Emails are forbidden in the content</li>
          <li>Forbidden characters are<code>&lt;</code> or <code>&gt;</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>A reference ID for the vehicle that can be used by buyers.</p>
        <p>Will be shown on the AutoScout24 plaform</p>
      </td>
      <td class="propExample"><p><code>A12453</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingpayload-offertype"><p>offerType</p></td>
      <td class="propType"><p>string</p></td>      <td class="propConstraints">
        <ul>
          <li>Allowed values can be retrieved via the references API (reference type OfferType)</li>
          <li>Mandatory for all listings</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Specifies the offer type of the vehicle.</p>
      </td>
      <td class="propExample"><p><code>U</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingpayload-oilcapacity"><p>oilCapacity</p></td>
      <td class="propType"><p>integer</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>0</code></li>
          <li class="numeric">Max. value: <code>100</code></li>
          <li class="numeric">Min. value: <code>0</code></li>
          <li class="numeric">Max. value: <code>100</code></li>
          <li>Forbidden for vehicleType <code>C</code> (car), <code>B</code> (bike), <code>X</code> (light commercial vehicle), <code>N</code> (caravan/mobile home), <code>L</code> (trailer), <code>A</code> (agricultural), <code>E</code> (heavy equipment), <code>O</code> (boat) and <code>W</code> (personal watercraft)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Oil capacity in liters.</p>
      </td>
      <td class="propExample"><p><code>10</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingpayload-oilcapacitymilliliters"><p>oilCapacityMilliliters</p></td>
      <td class="propType"><p>integer</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>0</code></li>
          <li class="numeric">Max. value: <code>100000</code></li>
          <li class="numeric">Min. value: <code>0</code></li>
          <li class="numeric">Max. value: <code>100000</code></li>
          <li>Forbidden for vehicleType <code>C</code> (car), <code>B</code> (bike), <code>X</code> (light commercial vehicle), <code>N</code> (caravan/mobile home), <code>L</code> (trailer), <code>A</code> (agricultural), <code>E</code> (heavy equipment), <code>O</code> (boat) and <code>W</code> (personal watercraft)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Oil capacity in milliliters.</p>
      </td>
      <td class="propExample"><p><code>10000</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingpayload-payload"><p>payload</p></td>
      <td class="propType"><p>integer</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>0</code></li>
          <li>Forbidden for vehicleType <code>C</code> (car) and <code>B</code> (bike)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Maximum payload the vehicle can carry in kg.</p>
      </td>
      <td class="propExample"><p><code>2900</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingpayload-power"><p>power</p></td>
      <td class="propType"><p>integer</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>1</code></li>
          <li class="numeric">Max. value: <code>9999</code></li>
          <li>Forbidden for vehicleType <code>L</code> (trailer)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Engine power in kW. Power in (German) PS does not need to be specified, as it will automatically be derived from this value.</p>
      </td>
      <td class="propExample"><p><code>110</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingpayload-previousownercount"><p>previousOwnerCount</p></td>
      <td class="propType"><p>integer</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>0</code></li>
          <li class="numeric">Max. value: <code>99</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Number of previous vehicle owners.</p>
      </td>
      <td class="propExample"><p><code>1</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingpayload-prices"><p>prices</p></td>
      <td class="propType"><p><a href="#/data-models?id=prices">Prices</a></p></td>      <td class="propConstraints">
        <ul>
          <li>Mandatory for EU market and private sellers. Optional only for Canadian dealers (sellerType='Dealer' and market='CA').</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Provides price information for the vehicle.</p>
      </td>
      <td class="propExample"><p></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingpayload-primaryfueltype"><p>primaryFuelType</p></td>
      <td class="propType"><p>integer</p></td>      <td class="propConstraints">
        <ul>
          <li>Allowed values can be retrieved via the references API (reference type FuelType).</li>
          <li>Mandatory for German dealers when the vehicle type is <code>C</code> (Car) and the car is considered new (<code>mileage</code> <= 1000 and <code>firstRegistrationDate</code> <= 8 months).</li>
          <li>Forbidden for vehicleType <code>L</code> (trailer)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Fuel type with the lowest emission for the vehicle. This is derived from German emission/consumption regulations for vehicles (EnVKV).</p>
      </td>
      <td class="propExample"><p><code>1</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingpayload-productionyear"><p>productionYear</p></td>
      <td class="propType"><p>string</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>The year when the vehicle was manufactured.</p>
      </td>
      <td class="propExample"><p><code>2014</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingpayload-publication"><p>publication</p></td>
      <td class="propType"><p><a href="#/data-models?id=publicationpayload">PublicationPayload</a></p></td>      <td class="propConstraints">
        <ul>
          <li>Mandatory for all listings</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Provides information about the publication status of the listing</p>
      </td>
      <td class="propExample"><p></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingpayload-rearaxleweightrating"><p>rearAxleWeightRating</p></td>
      <td class="propType"><p>integer</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>1</code></li>
          <li class="numeric">Max. value: <code>100000</code></li>
          <li>Forbidden for vehicleType <code>C</code> (car), <code>B</code> (bike), <code>N</code> (caravan/mobile home), <code>O</code> (boat), <code>W</code> (personal watercraft) and <code>S</code> (snowmobile)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Rear axle weight rating in kilograms.</p>
      </td>
      <td class="propExample"><p><code>8500</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingpayload-rearaxleweightratinggrams"><p>rearAxleWeightRatingGrams</p></td>
      <td class="propType"><p>integer</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>1000</code></li>
          <li class="numeric">Max. value: <code>100000000</code></li>
          <li>Forbidden for vehicleType <code>C</code> (car), <code>B</code> (bike), <code>N</code> (caravan/mobile home), <code>O</code> (boat), <code>W</code> (personal watercraft) and <code>S</code> (snowmobile)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Rear axle weight rating in grams.</p>
      </td>
      <td class="propExample"><p><code>8500000</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingpayload-requestedseals"><p>requestedSeals</p></td>
      <td class="propType"><p>array[integer]</p></td>      <td class="propConstraints">
        <ul>
          <li>Items must be unique</li>
          <li>This attribute only applies for customers that are dealers.</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>List of IDs for the used vehicle seals granted for the vehicle.</p>
        <p>Available values for the customer can be retrieved using the getSealsForCustomer operation.</p>
        <p><strong>Note:</strong> If passed seals are not granted with vehicle, the system will ignore those values and create the listings.</p>
      </td>
      <td class="propExample"><p></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingpayload-schwackecode"><p>schwackeCode</p></td>
      <td class="propType"><p>string</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Max. length: <code>22</code></li>
          <li>Forbidden for vehicleType <code>O</code> (boat) and <code>W</code> (personal watercraft)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Classification of makes and models given by Eurotax/Schwacke</p>
      </td>
      <td class="propExample"><p><code>20239429</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingpayload-sealsoverwriteprotection"><p>sealsOverwriteProtection</p></td>
      <td class="propType"><p>boolean</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>It can be only set by dealers logging in through MLC. If set to true, the seals will not be overwritten with any update request from data providers.</p>
      </td>
      <td class="propExample"><p><code>true</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingpayload-seatcount"><p>seatCount</p></td>
      <td class="propType"><p>integer</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>1</code></li>
          <li class="numeric">Max. value: <code>99</code></li>
          <li>Forbidden for vehicleType <code>L</code> (trailer)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Number of seats of the vehicle</p>
      </td>
      <td class="propExample"><p><code>5</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingpayload-skistancewidth"><p>skiStanceWidth</p></td>
      <td class="propType"><p>integer</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>1</code></li>
          <li class="numeric">Max. value: <code>2000</code></li>
          <li>Forbidden for vehicleType <code>C</code> (car), <code>B</code> (bike), <code>X</code> (light commercial vehicle), <code>N</code> (caravan/mobile home), <code>L</code> (trailer), <code>A</code> (agricultural), <code>E</code> (heavy equipment), <code>O</code> (boat) and <code>W</code> (personal watercraft)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Ski stance width in millimeters.</p>
      </td>
      <td class="propExample"><p><code>1000</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingpayload-slideoutcount"><p>slideOutCount</p></td>
      <td class="propType"><p>integer</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>0</code></li>
          <li class="numeric">Max. value: <code>10</code></li>
          <li>Forbidden for vehicleType <code>C</code> (car), <code>B</code> (bike), <code>X</code> (light commercial vehicle), <code>L</code> (trailer), <code>A</code> (agricultural), <code>E</code> (heavy equipment), <code>O</code> (boat), <code>W</code> (personal watercraft) and <code>S</code> (snowmobile)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Number of slide-outs.</p>
      </td>
      <td class="propExample"><p><code>2</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingpayload-steeringtype"><p>steeringType</p></td>
      <td class="propType"><p>string</p></td>      <td class="propConstraints">
        <ul>
          <li>Allowed values can be retrieved via the references API (reference type SteeringType)</li>
          <li>Forbidden for vehicleType <code>C</code> (car), <code>B</code> (bike), <code>X</code> (light commercial vehicle), <code>N</code> (caravan/mobile home), <code>L</code> (trailer), <code>A</code> (agricultural), <code>E</code> (heavy equipment), <code>W</code> (personal watercraft) and <code>S</code> (snowmobile)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Steering type.</p>
      </td>
      <td class="propExample"><p><code>T</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingpayload-totalheight"><p>totalHeight</p></td>
      <td class="propType"><p>integer</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>1</code></li>
          <li>Forbidden for vehicleType <code>C</code> (car), <code>B</code> (bike), <code>X</code> (light commercial vehicle) and <code>L</code> (trailer)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Height of the vehicle in mm. Only available when vehicleType is <code>N</code>.</p>
      </td>
      <td class="propExample"><p><code>200</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingpayload-totallength"><p>totalLength</p></td>
      <td class="propType"><p>integer</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>1</code></li>
          <li>Forbidden for vehicleType <code>C</code> (car), <code>B</code> (bike), <code>X</code> (light commercial vehicle) and <code>L</code> (trailer)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Length of the vehicle in mm. Only available when vehicleType is <code>N</code>.</p>
      </td>
      <td class="propExample"><p><code>200</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingpayload-totalwidth"><p>totalWidth</p></td>
      <td class="propType"><p>integer</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>1</code></li>
          <li>Forbidden for vehicleType <code>C</code> (car), <code>B</code> (bike), <code>X</code> (light commercial vehicle) and <code>L</code> (trailer)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Width of the vehicle in mm. Only available when vehicleType is <code>N</code></p>
      </td>
      <td class="propExample"><p><code>200</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingpayload-transmission"><p>transmission</p></td>
      <td class="propType"><p>string</p></td>      <td class="propConstraints">
        <ul>
          <li>Allowed values can be retrieved via the references API (reference type Transmission).</li>
          <li>Valid values for this reference type are dependent on the marketplace country of the customers.</li>
          <li>Forbidden for vehicleType <code>L</code> (trailer)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Specifies the transmission type of the vehicle (e.g. manual, automatic).</p>
      </td>
      <td class="propExample"><p><code>M</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingpayload-tsn"><p>tsn</p></td>
      <td class="propType"><p>string</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. length: <code>3</code></li>
          <li class="numeric">Max. length: <code>3</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Typschluesselnummer: Identifier used by vehicle manufacturers in Germany to specify a vehicle type.</p>
        <p>From TSN the following parameters can be derived: Model, body, engine type, fuel type etc.</p>
        <p>Combined with HSN a make/model combination can be fully specified.</p>
      </td>
      <td class="propExample"><p><code>936</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingpayload-twinner"><p>twinner</p></td>
      <td class="propType"><p><a href="#/data-models?id=twinnerpayload">TwinnerPayload</a></p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Provides Twinner information for the vehicle.</p>
      </td>
      <td class="propExample"><p></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingpayload-upholsterycolor"><p>upholsteryColor</p></td>
      <td class="propType"><p>integer</p></td>      <td class="propConstraints">
        <ul>
          <li>Allowed values can be retrieved via the references API (reference type InteriorColor)</li>
          <li>Forbidden for vehicleType <code>L</code> (trailer)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Basic color of vehicle’s interior. Used to enable search by basic interior color.</p>
      </td>
      <td class="propExample"><p><code>1</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingpayload-upholsterytype"><p>upholsteryType</p></td>
      <td class="propType"><p>string</p></td>      <td class="propConstraints">
        <ul>
          <li>Allowed values can be retrieved via the references API (reference type Upholstery)</li>
          <li>Forbidden for vehicleType <code>L</code> (trailer)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>The type of upholstery the vehicle has</p>
      </td>
      <td class="propExample"><p><code>AL</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingpayload-vehicletype"><p>vehicleType</p></td>
      <td class="propType"><p><a href="#/data-models?id=vehicletypeid">VehicleTypeId</a></p></td>      <td class="propConstraints">
        <ul>
          <li>Mandatory for all listings</li>
          <li>Allowed values can be retrieved via the references API (reference type VehicleType).</li>
          <li>Valid values for this reference type are dependent on the marketplace country of the customers.</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>The type of vehicle being listed.</p>
      </td>
      <td class="propExample"><p></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingpayload-vin"><p>vin</p></td>
      <td class="propType"><p>string</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. length: <code>17</code></li>
          <li class="numeric">Max. length: <code>17</code></li>
          <li>Emails are forbidden in the content</li>
          <li>Forbidden characters are<code>&lt;</code> or <code>&gt;</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Vehicle Identification Number. A unique international code including a serial number used to identify individual motor vehicles, towed vehicles and motorcycles</p>
      </td>
      <td class="propExample"><p><code>AB023475861123745</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingpayload-warranty"><p>warranty</p></td>
      <td class="propType"><p>integer</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>0</code></li>
          <li class="numeric">Max. value: <code>999</code></li>
          <li>This attribute only applies for customers that are dealers.</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Specifies the length in months of an additional warranty that is offered by the dealer.</p>
        <p>This warranty must be included in the vehicle price.</p>
        <p>If this field is not set, no warranty is provided</p>
      </td>
      <td class="propExample"><p><code>12</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingpayload-wascaborrental"><p>wasCabOrRental</p></td>
      <td class="propType"><p>boolean</p></td>      <td class="propConstraints">
        <ul>
          <li>Forbidden for vehicleType <code>B</code> (bike), <code>N</code> (caravan/mobile home), <code>L</code> (trailer) and <code>A</code> (agricultural)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Whether the vehicle has been used as cab or rental car or driving school car.</p>
      </td>
      <td class="propExample"><p><code>false</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingpayload-wastetankcapacity"><p>wasteTankCapacity</p></td>
      <td class="propType"><p>integer</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>0</code></li>
          <li class="numeric">Max. value: <code>10000</code></li>
          <li>Forbidden for vehicleType <code>C</code> (car), <code>B</code> (bike), <code>X</code> (light commercial vehicle), <code>L</code> (trailer), <code>A</code> (agricultural), <code>E</code> (heavy equipment), <code>O</code> (boat), <code>W</code> (personal watercraft) and <code>S</code> (snowmobile)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Waste tank capacity in liters.</p>
      </td>
      <td class="propExample"><p><code>100</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingpayload-wastetankcapacitymilliliters"><p>wasteTankCapacityMilliliters</p></td>
      <td class="propType"><p>integer</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>0</code></li>
          <li class="numeric">Max. value: <code>10000000</code></li>
          <li>Forbidden for vehicleType <code>C</code> (car), <code>B</code> (bike), <code>X</code> (light commercial vehicle), <code>L</code> (trailer), <code>A</code> (agricultural), <code>E</code> (heavy equipment), <code>O</code> (boat), <code>W</code> (personal watercraft) and <code>S</code> (snowmobile)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Waste tank capacity in milliliters.</p>
      </td>
      <td class="propExample"><p><code>100000</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingpayload-watertankcapacity"><p>waterTankCapacity</p></td>
      <td class="propType"><p>integer</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>0</code></li>
          <li class="numeric">Max. value: <code>1000</code></li>
          <li>Forbidden for vehicleType <code>C</code> (car), <code>B</code> (bike), <code>X</code> (light commercial vehicle), <code>L</code> (trailer), <code>A</code> (agricultural), <code>E</code> (heavy equipment), <code>O</code> (boat), <code>W</code> (personal watercraft) and <code>S</code> (snowmobile)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Water tank capacity in liters.</p>
      </td>
      <td class="propExample"><p><code>150</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingpayload-watertankcapacitymilliliters"><p>waterTankCapacityMilliliters</p></td>
      <td class="propType"><p>integer</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>0</code></li>
          <li class="numeric">Max. value: <code>1000000</code></li>
          <li>Forbidden for vehicleType <code>C</code> (car), <code>B</code> (bike), <code>X</code> (light commercial vehicle), <code>L</code> (trailer), <code>A</code> (agricultural), <code>E</code> (heavy equipment), <code>O</code> (boat), <code>W</code> (personal watercraft) and <code>S</code> (snowmobile)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Water tank capacity in milliliters.</p>
      </td>
      <td class="propExample"><p><code>150000</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingpayload-wheelbase"><p>wheelbase</p></td>
      <td class="propType"><p>integer</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>1</code></li>
          <li class="numeric">Min. value: <code>1</code></li>
          <li>Forbidden for vehicleType <code>C</code> (car), <code>B</code> (bike), <code>L</code> (trailer), <code>O</code> (boat), <code>W</code> (personal watercraft) and <code>S</code> (snowmobile)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>The distance between the centers of the front and rear wheels, measured in millimeters.</p>
      </td>
      <td class="propExample"><p><code>2800</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingpayload-wltp"><p>wltp</p></td>
      <td class="propType"><p><a href="#/data-models?id=wltpcommon">WltpCommon</a></p></td>      <td class="propConstraints">
        <ul>
          <li>Forbidden for vehicleType <code>L</code> (trailer)</li>
          <li>Forbidden if NEDC consumption values are set (<code>consumption</code>, <code>co2Emissions</code> or <code>efficiencyClass</code>)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Provides WLTP consumption information.</p>
      </td>
      <td class="propExample"><p></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingpayload-youtubevideourl"><p>youtubeVideoUrl</p></td>
      <td class="propType"><p>url</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. length: <code>1</code></li>
          <li class="numeric">Max. length: <code>256</code></li>
          <li>Must be a YouTube URL</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Youtube video for the vehicle.</p>
        <p>Videos from other platforms other than Youtube are not accepted</p>
      </td>
      <td class="propExample"><p><code>https://www.youtube.com/watch?v=wnKJnWRa_Ks</code></p></td>
    </tr>

  </tbody>
</table>


## ListingSummary
<table>
  <tbody>
    <tr>
      <th>Field name</th>
      <th>Type</th><th>Mandatory</th> <th>Other constraints</th>
      <th>Description</th>
      <th>Example</th>
    </tr>    <tr>
      <td class="propName" id="data-models-property-listingsummary-createdat"><p>createdAt</p></td>
      <td class="propType"><p>date-time</p></td><td class="propMandatory"><p>Yes</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>The time when the listing was created in ISO-8601 format.</p>
      </td>
      <td class="propExample"><p><code>2019-02-07T16:07:00.665267Z</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingsummary-crossreferenceid"><p>crossReferenceId</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Cross Reference Id is an identifier used by Data Providers.</p>
      </td>
      <td class="propExample"><p><code>CA-A12453</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingsummary-id"><p>id</p></td>
      <td class="propType"><p>guid</p></td><td class="propMandatory"><p>Yes</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>The unique identifier of the listing</p>
      </td>
      <td class="propExample"><p><code>cf04da2d-9c57-4758-8735-5257e4eb1cae</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingsummary-lastupdatedat"><p>lastUpdatedAt</p></td>
      <td class="propType"><p>date-time</p></td><td class="propMandatory"><p>Yes</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>The time when the listing was last updated in ISO-8601 format.</p>
        <p>This value can be used to decide whether the local copy of the listing in a given client is stale or not.</p>
      </td>
      <td class="propExample"><p><code>2019-03-07T16:07:00.665267Z</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingsummary-offerreferenceid"><p>offerReferenceId</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>A reference ID for the vehicle that can be used by buyers.</p>
        <p>Will be shown on the AutoScout24 plaform</p>
      </td>
      <td class="propExample"><p><code>A12453</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingsummary-overwriteprotection"><p>overwriteProtection</p></td>
      <td class="propType"><p>boolean</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li>This attribute only applies to customers that are dealers.</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Indicates whether overwrite protection is enabled for the listing.</p>
        <p>This field is returned only when requested using the include query parameter.</p>
      </td>
      <td class="propExample"><p><code>false</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingsummary-vinenrichmentmissingfields"><p>vinEnrichmentMissingFields</p></td>
      <td class="propType"><p>array[string]</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>The missing fields after the VIN enrichment</p>
      </td>
      <td class="propExample"><p></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-listingsummary-vinenrichmentstatus"><p>vinEnrichmentStatus</p></td>
      <td class="propType"><p><a href="#/data-models?id=vinenrichmentstatus">VinEnrichmentStatus</a></p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>The status of the vin enrichment</p>
      </td>
      <td class="propExample"><p></p></td>
    </tr>

  </tbody>
</table>


## Listings
<table>
  <tbody>
    <tr>
      <th>Field name</th>
      <th>Type</th><th>Mandatory</th> <th>Other constraints</th>
      <th>Description</th>
      <th>Example</th>
    </tr>    <tr>
      <td class="propName" id="data-models-property-listings-listings"><p>listings</p></td>
      <td class="propType"><p>array[<a href="#/data-models?id=listingsummary">ListingSummary</a>]</p></td><td class="propMandatory"><p>Yes</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>the listings that were asked for</p>
      </td>
      <td class="propExample"><p></p></td>
    </tr>

  </tbody>
</table>


## Make
<table>
  <tbody>
    <tr>
      <th>Field name</th>
      <th>Type</th><th>Mandatory</th> <th>Other constraints</th>
      <th>Description</th>
      <th>Example</th>
    </tr>    <tr>
      <td class="propName" id="data-models-property-make-id"><p>id</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>Yes</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>an identifier of the make</p>
      </td>
      <td class="propExample"><p><code>13</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-make-models"><p>models</p></td>
      <td class="propType"><p>array[<a href="#/data-models?id=model">Model</a>]</p></td><td class="propMandatory"><p>Yes</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>the set of models that belong to this make</p>
      </td>
      <td class="propExample"><p></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-make-name"><p>name</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>Yes</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>the name of the given make</p>
      </td>
      <td class="propExample"><p><code>BMW</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-make-vehicletypes"><p>vehicleTypes</p></td>
      <td class="propType"><p>array[<a href="#/data-models?id=vehicletypeid">VehicleTypeId</a>]</p></td><td class="propMandatory"><p>Yes</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>the vehicle types for which this make is available</p>
      </td>
      <td class="propExample"><p></p></td>
    </tr>

  </tbody>
</table>


## Makes
<table>
  <tbody>
    <tr>
      <th>Field name</th>
      <th>Type</th><th>Mandatory</th> <th>Other constraints</th>
      <th>Description</th>
      <th>Example</th>
    </tr>    <tr>
      <td class="propName" id="data-models-property-makes-makes"><p>makes</p></td>
      <td class="propType"><p>array[<a href="#/data-models?id=make">Make</a>]</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>a set of makes</p>
      </td>
      <td class="propExample"><p></p></td>
    </tr>

  </tbody>
</table>


## Marketing
<table>
  <tbody>
    <tr>
      <th>Field name</th>
      <th>Type</th><th>Mandatory</th> <th>Other constraints</th>
      <th>Description</th>
      <th>Example</th>
    </tr>    <tr>
      <td class="propName" id="data-models-property-marketing-exclusiveoffer"><p>exclusiveOffer</p></td>
      <td class="propType"><p><a href="#/data-models?id=exclusiveoffer">ExclusiveOffer</a></p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Allows to use the product Exclusive Offer on this listing</p>
        <p><strong>:construction: This functionality is currently under construction and will not be shown to Autoscout24 users</strong></p>
      </td>
      <td class="propExample"><p></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-marketing-listingboost"><p>listingBoost</p></td>
      <td class="propType"><p><a href="#/data-models?id=listingboost">ListingBoost</a></p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Provides information about ListingBoost properties for this listing.</p>
        <p>This process is asynchronous. Please perform a GET request on the listing after a while to verify whether the ListingBoost has been applied.</p>
        <p>Please contact us if you are interested in this feature.</p>
      </td>
      <td class="propExample"><p></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-marketing-mia"><p>mia</p></td>
      <td class="propType"><p><a href="#/data-models?id=mia">Mia</a></p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Provides information about a possible manual override for the MIA product for this listing</p>
      </td>
      <td class="propExample"><p></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-marketing-redpencil"><p>redPencil</p></td>
      <td class="propType"><p>boolean</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Bookable feature indicating that the price of a vehicle was reduced, showing the old price and the new price.</p>
        <p><strong>🚧 This functionality is currently under construction and will not be shown to Autoscout24 users</strong></p>
      </td>
      <td class="propExample"><p><code>false</code></p></td>
    </tr>

  </tbody>
</table>


## MarketingPayload
<table>
  <tbody>
    <tr>
      <th>Field name</th>
      <th>Type</th><th>Mandatory</th> <th>Other constraints</th>
      <th>Description</th>
      <th>Example</th>
    </tr>    <tr>
      <td class="propName" id="data-models-property-marketingpayload-exclusiveoffer"><p>exclusiveOffer</p></td>
      <td class="propType"><p><a href="#/data-models?id=exclusiveofferpayload">ExclusiveOfferPayload</a></p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Allows to use the product Exclusive Offer on this listing</p>
        <p><strong>:construction: This functionality is currently under construction and will not be shown to Autoscout24 users</strong></p>
      </td>
      <td class="propExample"><p></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-marketingpayload-listingboost"><p>listingBoost</p></td>
      <td class="propType"><p><a href="#/data-models?id=listingboostpayload">ListingBoostPayload</a></p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Allows to use the ListingBoost on this listing.</p>
      </td>
      <td class="propExample"><p></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-marketingpayload-mia"><p>mia</p></td>
      <td class="propType"><p><a href="#/data-models?id=miapayload">MiaPayload</a></p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Provides a manual override for the MIA product for this listing</p>
      </td>
      <td class="propExample"><p></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-marketingpayload-redpencil"><p>redPencil</p></td>
      <td class="propType"><p>boolean</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Bookable feature indicating that the price of a vehicle was reduced, showing the old price and the new price.</p>
        <p><strong>🚧 This functionality is currently under construction and will not be shown to Autoscout24 users</strong></p>
      </td>
      <td class="propExample"><p><code>false</code></p></td>
    </tr>

  </tbody>
</table>


## Marketplace
<table>
  <tbody>
    <tr>
      <th>Field name</th>
      <th>Type</th><th>Mandatory</th> <th>Other constraints</th>
      <th>Description</th>
      <th>Example</th>
    </tr>    <tr>
      <td class="propName" id="data-models-property-marketplace--"><p>-</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li>Allowed values are: <code>at</code>, <code>be</code>, <code>ca</code>, <code>de</code>, <code>es</code>, <code>fr</code>, <code>it</code>, <code>lu</code>, <code>nl</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Marketplaces supported by AS24.</p>
      </td>
      <td class="propExample"><p><code>de</code></p></td>
    </tr>

  </tbody>
</table>


## Mia
<table>
  <tbody>
    <tr>
      <th>Field name</th>
      <th>Type</th><th>Mandatory</th> <th>Other constraints</th>
      <th>Description</th>
      <th>Example</th>
    </tr>    <tr>
      <td class="propName" id="data-models-property-mia-appliedtier"><p>appliedTier</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li>Allowed values are: <code>T20</code>, <code>T30</code>, <code>T40</code>, <code>T50</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>The tier increases the priority and visibility of a listing in the search results, set from tier product.</p>
        <p>Available tier levels are: <code>T20</code> (PlusInserat/Optimum…), <code>T30</code> (PremiumInserat/Premium), <code>T40</code> (PlatinumInserat/Platinum), <code>T50</code> (SalesTurbo)</p>
      </td>
      <td class="propExample"><p><code>T20</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-mia-subtitle"><p>subtitle</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Max. length: <code>55</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>An additional vehicle description, will be shown for listings that have a tier applied.  Note a tier can be applied manually or automatically.</p>
      </td>
      <td class="propExample"><p><code>First hand, from an authorized dealer. Discount.</code></p></td>
    </tr>

  </tbody>
</table>


## MiaPayload
<table>
  <tbody>
    <tr>
      <th>Field name</th>
      <th>Type</th><th>Mandatory</th> <th>Other constraints</th>
      <th>Description</th>
      <th>Example</th>
    </tr>    <tr>
      <td class="propName" id="data-models-property-miapayload-requestedtier"><p>requestedTier</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li>Allowed values are: <code>T20</code>, <code>T30</code></li>
          <li>Tiers can only be added for dealers that have a contract to this feature.</li>
          <li>This can be checked in the customer endpoint in <code>canSetMiaRequestedTier</code>. If a customer can not request a mia tier, it will be silently ignored.</li>
          <li>Available tier levels are: <code>T20</code> (PlusInserat/Optimum…), <code>T30</code> (PremiumInserat/Premium).</li>
          <li>Its not possible to set <code>T40</code> or <code>T50</code> as a requestedTier.</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Increases the priority and visibility of listings in the search results.</p>
        <p>Adding a tier will cause charges to the dealer.</p>
      </td>
      <td class="propExample"><p><code>T20</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-miapayload-subtitle"><p>subtitle</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Max. length: <code>55</code></li>
          <li>URLs are forbidden in the content</li>
          <li>Emails are forbidden in the content</li>
          <li>Forbidden characters are<code>&lt;</code> or <code>&gt;</code></li>
          <li>Empty strings are not allowed</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>An additional vehicle description, will be shown for listings that have a tier applied.</p>
        <p>Note a tier can be applied manually or automatically, so this value should be sent even if the requestedTier field is not set.</p>
      </td>
      <td class="propExample"><p><code>First hand, from an authorized dealer. Discount.</code></p></td>
    </tr>

  </tbody>
</table>


## Model
<table>
  <tbody>
    <tr>
      <th>Field name</th>
      <th>Type</th><th>Mandatory</th> <th>Other constraints</th>
      <th>Description</th>
      <th>Example</th>
    </tr>    <tr>
      <td class="propName" id="data-models-property-model-id"><p>id</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>Yes</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>an identifier of the model</p>
      </td>
      <td class="propExample"><p><code>1641</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-model-name"><p>name</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>Yes</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>the name of the given model</p>
      </td>
      <td class="propExample"><p><code>320</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-model-vehicletype"><p>vehicleType</p></td>
      <td class="propType"><p><a href="#/data-models?id=vehicletypeid">VehicleTypeId</a></p></td><td class="propMandatory"><p>Yes</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>The type of vehicle.</p>
      </td>
      <td class="propExample"><p></p></td>
    </tr>

  </tbody>
</table>


## OnlineSale
<table>
  <tbody>
    <tr>
      <th>Field name</th>
      <th>Type</th><th>Mandatory</th> <th>Other constraints</th>
      <th>Description</th>
      <th>Example</th>
    </tr>    <tr>
      <td class="propName" id="data-models-property-onlinesale-deliveryareas"><p>deliveryAreas</p></td>
      <td class="propType"><p>object</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>The countries where the vehicle can be sold online and delivered to the buyer.</p>
      </td>
      <td class="propExample"><p><code>{
  "national": "DE"
}
</code></p></td>
    </tr>

  </tbody>
</table>


## PartialListingBoostPayload
<table>
  <tbody>
    <tr>
      <th>Field name</th>
      <th>Type</th><th>Mandatory</th> <th>Other constraints</th>
      <th>Description</th>
      <th>Example</th>
    </tr>    <tr>
      <td class="propName" id="data-models-property-partiallistingboostpayload-requested"><p>requested</p></td>
      <td class="propType"><p>boolean</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>The request required for the listing to become a ListingBoost candidate.</p>
        <p>Should be set to TRUE if a ListingBoost is requested to apply, FALSE if it is requested to be removed, or NULL if no change is needed.</p>
      </td>
      <td class="propExample"><p><code>false</code></p></td>
    </tr>

  </tbody>
</table>


## PartialListingPayload
<table>
  <tbody>
    <tr>
      <th>Field name</th>
      <th>Type</th><th>Mandatory</th> <th>Other constraints</th>
      <th>Description</th>
      <th>Example</th>
    </tr>    <tr>
      <td class="propName" id="data-models-property-partiallistingpayload-additionalfueltypes"><p>additionalFuelTypes</p></td>
      <td class="propType"><p>array[integer]</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li>Items must be unique</li>
          <li>Forbidden for vehicleType <code>L</code> (trailer)</li>
          <li>Optional for vehicleType  <code>C</code> (Car), <code>X</code> (light commercial vehicle), <code>B</code> (bikes), <code>N</code> (caravan/mobile home)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Additional supported fuel types that might accompany the primary fuel type.</p>
        <p>These fuel types can also be consumed by the vehicle but have higher emissions than the primary fuel type.</p>
        <p>This is derived from German emission/consumption regulations for vehicles (EnVKV).</p>
      </td>
      <td class="propExample"><p></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-partiallistingpayload-alloywheelsize"><p>alloyWheelSize</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>10</code></li>
          <li class="numeric">Max. value: <code>26</code></li>
          <li class="numeric">Min. value: <code>10</code></li>
          <li class="numeric">Max. value: <code>26</code></li>
          <li>This property can only be specified if the equipment <code>15 "Alloy Wheels"</code> is set in the equipment property.</li>
          <li>Forbidden for vehicleType <code>A</code> (agricultural), <code>E</code> (heavy equipment), <code>O</code> (boat), <code>W</code> (personal watercraft) and <code>S</code> (snowmobile)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Size of alloy wheels of the vehicle (in inches).</p>
      </td>
      <td class="propExample"><p><code>18</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-partiallistingpayload-auxiliarypower"><p>auxiliaryPower</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li>Allowed values can be retrieved via the references API (reference type FuelCategory)</li>
          <li>Forbidden for vehicleType <code>C</code> (car), <code>B</code> (bike), <code>X</code> (light commercial vehicle), <code>N</code> (caravan/mobile home), <code>L</code> (trailer), <code>A</code> (agricultural), <code>E</code> (heavy equipment), <code>W</code> (personal watercraft) and <code>S</code> (snowmobile)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Auxiliary power source type.</p>
      </td>
      <td class="propExample"><p><code>B</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-partiallistingpayload-availability"><p>availability</p></td>
      <td class="propType"><p><a href="#/data-models?id=availability">Availability</a></p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li>Mandatory for all listings</li>
          <li>This attribute only applies for customers that are dealers (sellerType='Dealer').</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Provides information about when the vehicle is available.</p>
      </td>
      <td class="propExample"><p></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-partiallistingpayload-axlecount"><p>axleCount</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>1</code></li>
          <li class="numeric">Max. value: <code>6</code></li>
          <li class="numeric">Min. value: <code>1</code></li>
          <li class="numeric">Max. value: <code>6</code></li>
          <li>Forbidden for vehicleType <code>C</code> (car), <code>B</code> (bike), <code>O</code> (boat), <code>W</code> (personal watercraft) and <code>S</code> (snowmobile)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>The number of axles the vehicle has.</p>
      </td>
      <td class="propExample"><p><code>1</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-partiallistingpayload-axlespread"><p>axleSpread</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>1</code></li>
          <li class="numeric">Max. value: <code>10000</code></li>
          <li>Forbidden for vehicleType <code>C</code> (car), <code>B</code> (bike), <code>N</code> (caravan/mobile home), <code>O</code> (boat), <code>W</code> (personal watercraft) and <code>S</code> (snowmobile)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Distance between left and right wheel for the rear axles.</p>
      </td>
      <td class="propExample"><p><code>5000</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-partiallistingpayload-battery"><p>battery</p></td>
      <td class="propType"><p><a href="#/data-models?id=batterypayload">BatteryPayload</a></p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Information about the vehicle's battery</p>
      </td>
      <td class="propExample"><p></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-partiallistingpayload-bedcount"><p>bedCount</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>0</code></li>
          <li class="numeric">Max. value: <code>9</code></li>
          <li class="numeric">Min. value: <code>0</code></li>
          <li class="numeric">Max. value: <code>9</code></li>
          <li>Forbidden for vehicleType <code>C</code> (car), <code>B</code> (bike), <code>X</code> (light commercial vehicle), <code>L</code> (trailer), <code>A</code> (agricultural), <code>E</code> (heavy equipment), <code>W</code> (personal watercraft) and <code>S</code> (snowmobile)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Total number of beds.</p>
      </td>
      <td class="propExample"><p><code>4</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-partiallistingpayload-belgiancarpassmileageurl"><p>belgianCarpassMileageUrl</p></td>
      <td class="propType"><p>url</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li>Forbidden for vehicleType <code>L</code> (trailer), <code>O</code> (boat), <code>W</code> (personal watercraft) and <code>S</code> (snowmobile)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>The URL for the Carpass technical inspection for the listed vehicle</p>
      </td>
      <td class="propExample"><p><code>https://public.car-pass.be/vhr/2a0f0719-1b7a-4e42-84e1-c5c746ab1c39</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-partiallistingpayload-bodycolor"><p>bodyColor</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Basic body color of the vehicle.</p>
      </td>
      <td class="propExample"><p><code>2</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-partiallistingpayload-bodycolorname"><p>bodyColorName</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. length: <code>1</code></li>
          <li class="numeric">Max. length: <code>30</code></li>
          <li>Emails are forbidden in the content</li>
          <li>Forbidden characters are<code>&lt;</code> or <code>&gt;</code></li>
          <li>Strings longer than 30 characters are accepted by the API but will be truncated to 30 characters.</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Manufacturers name of body color.</p>
      </td>
      <td class="propExample"><p><code>British Racing Green</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-partiallistingpayload-bodytype"><p>bodyType</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li>Allowed values can be retrieved via the references API (reference type BodyType)</li>
          <li>Valid values for this reference type are dependent on the marketplace country of the customers.</li>
          <li>Mandatory for all listings (except vehicleType <code>S</code> (Snowmobile) where it is forbidden)</li>
          <li>Mandatory for vehicleType <code>C</code> (car), <code>B</code> (bike), <code>X</code> (light commercial vehicle), <code>N</code> (caravan/mobile home), <code>L</code> (trailer), <code>A</code> (agricultural), <code>E</code> (heavy equipment), <code>O</code> (boat) and <code>W</code> (personal watercraft)</li>
          <li>Forbidden for vehicleType <code>S</code> (snowmobile)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Shape of vehicle’s body.</p>
      </td>
      <td class="propExample"><p><code>1</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-partiallistingpayload-braketype"><p>brakeType</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li>Allowed values can be retrieved via the references API (reference type BrakeType)</li>
          <li>Forbidden for vehicleType <code>C</code> (car), <code>B</code> (bike), <code>N</code> (caravan/mobile home), <code>O</code> (boat), <code>W</code> (personal watercraft) and <code>S</code> (snowmobile)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Type of brakes.</p>
      </td>
      <td class="propExample"><p><code>A</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-partiallistingpayload-cabinaxledistance"><p>cabinAxleDistance</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>1</code></li>
          <li class="numeric">Max. value: <code>10000</code></li>
          <li class="numeric">Min. value: <code>1</code></li>
          <li class="numeric">Max. value: <code>10000</code></li>
          <li>Forbidden for vehicleType <code>C</code> (car), <code>B</code> (bike), <code>N</code> (caravan/mobile home), <code>L</code> (trailer), <code>A</code> (agricultural), <code>E</code> (heavy equipment), <code>O</code> (boat), <code>W</code> (personal watercraft) and <code>S</code> (snowmobile)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Distance between end of the cabin to the center of the rear axle group in mm.</p>
      </td>
      <td class="propExample"><p><code>3500</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-partiallistingpayload-chassisbedlength"><p>chassisBedLength</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li>Allowed values can be retrieved via the references API (reference type BedType)</li>
          <li>Forbidden for vehicleType <code>C</code> (car), <code>B</code> (bike), <code>X</code> (light commercial vehicle), <code>L</code> (trailer), <code>A</code> (agricultural), <code>E</code> (heavy equipment), <code>O</code> (boat), <code>W</code> (personal watercraft) and <code>S</code> (snowmobile)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Chassis bed length.</p>
      </td>
      <td class="propExample"><p><code>L</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-partiallistingpayload-chassismanufacturername"><p>chassisManufacturerName</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Max. length: <code>100</code></li>
          <li class="numeric">Max. length: <code>100</code></li>
          <li>Forbidden for vehicleType <code>C</code> (car), <code>B</code> (bike), <code>X</code> (light commercial vehicle), <code>L</code> (trailer), <code>A</code> (agricultural), <code>E</code> (heavy equipment), <code>O</code> (boat), <code>W</code> (personal watercraft) and <code>S</code> (snowmobile)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>The manufacturer of the chassis.</p>
      </td>
      <td class="propExample"><p><code>Ford</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-partiallistingpayload-co2emissions"><p>co2Emissions</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li>*Deprecated, use <code>wltp.co2EmissionsCombined</code> or <code>wltp.co2EmissionsCombinedWeighted</code> instead*</li>
          <li>Mandatory and not smaller than 1 for German dealers when the car is considered new (<code>mileage</code> <= 1000)</li>
          <li>Forbidden for vehicleType <code>L</code> (trailer)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Vehicle’s carbon dioxide emission in g/km.</p>
      </td>
      <td class="propExample"><p><code>23</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-partiallistingpayload-condition"><p>condition</p></td>
      <td class="propType"><p><a href="#/data-models?id=condition">Condition</a></p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Describes the current condition of the vehicle</p>
      </td>
      <td class="propExample"><p></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-partiallistingpayload-consumption"><p>consumption</p></td>
      <td class="propType"><p><a href="#/data-models?id=consumption">Consumption</a></p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li>*Deprecated, use <code>wltp.consumptionCombined</code> or <code>wltp.consumptionCombinedWeighted</code> instead*</li>
          <li>Forbidden for vehicleType <code>L</code> (trailer)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Provides fuel and electric consumption information for the vehicle.</p>
      </td>
      <td class="propExample"><p></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-partiallistingpayload-costmodel"><p>costModel</p></td>
      <td class="propType"><p><a href="#/data-models?id=costmodelpayload">CostModelPayload</a></p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li>This attribute only applies for customers that are dealers.</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Provides information about the costs associated with the vehicle.</p>
      </td>
      <td class="propExample"><p></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-partiallistingpayload-countryversion"><p>countryVersion</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li>Allowed values can be retrieved via the references API (reference type Country)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Indicates the original market/country the vehicle was built for.</p>
      </td>
      <td class="propExample"><p><code>AT</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-partiallistingpayload-crossreferenceid"><p>crossReferenceId</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. length: <code>1</code></li>
          <li class="numeric">Max. length: <code>50</code></li>
          <li>URLs are forbidden in the content</li>
          <li>Emails are forbidden in the content</li>
          <li>Forbidden characters are<code>&lt;</code> or <code>&gt;</code></li>
          <li>This attribute only applies for customers that are dealers.</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>A reference that can be used when managing or identifying listings.</p>
        <p>This information will not be shown on the AutoScout24 platform.</p>
      </td>
      <td class="propExample"><p><code>DATX_002</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-partiallistingpayload-cylindercapacity"><p>cylinderCapacity</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>1</code></li>
          <li class="numeric">Max. value: <code>99999</code></li>
          <li>Forbidden for vehicleType <code>L</code> (trailer)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Volume of the engines cylinders in cubic centimeters.</p>
      </td>
      <td class="propExample"><p><code>1998</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-partiallistingpayload-cylindercount"><p>cylinderCount</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>1</code></li>
          <li class="numeric">Max. value: <code>99</code></li>
          <li>Forbidden for vehicleType <code>L</code> (trailer)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>The number of cylinders of the engine.</p>
      </td>
      <td class="propExample"><p><code>4</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-partiallistingpayload-description"><p>description</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Max. length: <code>10000</code></li>
          <li>Text may be formatted by tags. The following tags are supported:</li>
          <li>Line break: <code>\n</code> equivalent to HTML's <code>&lt;br&gt;</code>.</li>
          <li>Horizontal line: <code>----</code>  equivalent to HTML's <code>&lt;hr&gt;</code> and always accompanied by an automatic line break.</li>
          <li>Bold: <code>**lorem ipsum**</code> equivalent to HTML's <code>&lt;b&gt;lorem ipsum&lt;/b&gt;</code></li>
          <li>Bulleted list: <code>\\\\* lorem \\\\* ipsum</code></li>
          <li>Note that the first 10000 characters are displayed. Generally 1 character is equal to 1 byte but characters from the extended alphabet like “ä” count as 2 bytes.</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Free text description of the vehicle.</p>
      </td>
      <td class="propExample"><p><code>This car is **great**. ---- It has the following features: \n \\\\* Low price \\\\* Great interior
</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-partiallistingpayload-differentialratio"><p>differentialRatio</p></td>
      <td class="propType"><p>double</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>0.01</code></li>
          <li class="numeric">Max. value: <code>100</code></li>
          <li>Forbidden for vehicleType <code>C</code> (car), <code>B</code> (bike), <code>N</code> (caravan/mobile home), <code>O</code> (boat), <code>W</code> (personal watercraft) and <code>S</code> (snowmobile)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Differential ratio with precision 4 and scale 2. Ratio between driveshaft and wheel rotation. </p>
      </td>
      <td class="propExample"><p><code>3.73</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-partiallistingpayload-doorcount"><p>doorCount</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>1</code></li>
          <li class="numeric">Max. value: <code>9</code></li>
          <li>Forbidden for vehicleType <code>O</code> (boat), <code>W</code> (personal watercraft) and <code>S</code> (snowmobile)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Number of doors the vehicle has</p>
      </td>
      <td class="propExample"><p><code>5</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-partiallistingpayload-drivetrain"><p>drivetrain</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li>Allowed values can be retrieved via the references API (reference type DriveType)</li>
          <li>Forbidden for vehicleType <code>L</code> (trailer)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Drive type of the vehicle.</p>
      </td>
      <td class="propExample"><p><code>R</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-partiallistingpayload-drivingmode"><p>drivingMode</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li>Allowed values are: <code>ChainDrive</code>, <code>BeltDrive</code>, <code>CrankDrive</code></li>
          <li>Forbidden for vehicleType <code>C</code> (car), <code>X</code> (light commercial vehicle), <code>N</code> (caravan/mobile home) and <code>L</code> (trailer)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>The drive type of the bike. Possible values are ChainDrive, BeltDrive, CrankDrive.</p>
      </td>
      <td class="propExample"><p><code>ChainDrive</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-partiallistingpayload-ecode"><p>eCode</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. length: <code>15</code></li>
          <li class="numeric">Max. length: <code>15</code></li>
          <li class="numeric">Min. length: <code>15</code></li>
          <li class="numeric">Max. length: <code>15</code></li>
          <li>It should begins with "01" or "02" or "03" or "04" or "05"</li>
          <li>All characters should be numeric</li>
          <li>It is not allowed for vehicleType <code>L</code> (trailer)</li>
          <li>Forbidden for vehicleType <code>O</code> (boat), <code>W</code> (personal watercraft) and <code>S</code> (snowmobile)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Classification of makes and models given by data vendor DAT</p>
      </td>
      <td class="propExample"><p><code>010200020100001</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-partiallistingpayload-efficiencyclass"><p>efficiencyClass</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li>*Deprecated, use <code>wltp.co2Class</code> instead*</li>
          <li>Allowed values can be retrieved via the references API (reference type EfficiencyClass)</li>
          <li>Mandatory for German dealers when vehicleType is <code>C</code> and the car is considered new (<code>mileage</code> <= 1000 and <code>firstRegistrationDate</code> <= 8 months).</li>
          <li>Forbidden for vehicleType <code>B</code> (bike), <code>L</code> (trailer), <code>O</code> (boat), <code>W</code> (personal watercraft) and <code>S</code> (snowmobile)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Vehicle’s energy efficiency class.</p>
      </td>
      <td class="propExample"><p><code>2</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-partiallistingpayload-electricrange"><p>electricRange</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>1</code></li>
          <li class="numeric">Max. value: <code>10000</code></li>
          <li>Mandatory for German dealers when the consumption values are WLTP and the vehicle type is <code>C</code> (Car), <code>primaryFuelType</code> is <code>12</code> (electric / PHEV / EV) and the car is considered new (<code>mileage</code> <= 1000 and <code>firstRegistrationDate</code> <= 8 months).</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>The electric range of the vehicle in kilometers according to WLTP. (EAER)</p>
      </td>
      <td class="propExample"><p><code>620</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-partiallistingpayload-electricrangecity"><p>electricRangeCity</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>1</code></li>
          <li class="numeric">Max. value: <code>10000</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>The electric range of the vehicle in kilometers according to WLTP measured in cities. (EAER city)</p>
      </td>
      <td class="propExample"><p><code>410</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-partiallistingpayload-emptyweight"><p>emptyWeight</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>1</code></li>
          <li class="numeric">Max. value: <code>99999</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Vehicle’s weight without driver, passengers or liquids (like fuel) in kg.</p>
      </td>
      <td class="propExample"><p><code>1200</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-partiallistingpayload-emptyweightgrams"><p>emptyWeightGrams</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>1000</code></li>
          <li class="numeric">Max. value: <code>99999000</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Vehicle’s weight without driver, passengers or liquids (like fuel) in grams.</p>
        <p>Use this field instead of emptyWeight when submitting values in imperial units (lbs) to avoid rounding loss.</p>
      </td>
      <td class="propExample"><p><code>1200000</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-partiallistingpayload-enginecoolingsystem"><p>engineCoolingSystem</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li>Allowed values can be retrieved via the references API (reference type EngineCoolingSystem)</li>
          <li>Forbidden for vehicleType <code>C</code> (car), <code>X</code> (light commercial vehicle), <code>N</code> (caravan/mobile home), <code>L</code> (trailer), <code>A</code> (agricultural), <code>E</code> (heavy equipment), <code>O</code> (boat) and <code>W</code> (personal watercraft)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Engine cooling system type.</p>
      </td>
      <td class="propExample"><p><code>O</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-partiallistingpayload-enginecount"><p>engineCount</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>0</code></li>
          <li class="numeric">Max. value: <code>10</code></li>
          <li>Forbidden for vehicleType <code>C</code> (car), <code>B</code> (bike), <code>X</code> (light commercial vehicle), <code>N</code> (caravan/mobile home), <code>L</code> (trailer), <code>A</code> (agricultural), <code>E</code> (heavy equipment), <code>W</code> (personal watercraft) and <code>S</code> (snowmobile)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Number of engines.</p>
      </td>
      <td class="propExample"><p><code>2</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-partiallistingpayload-enginehours"><p>engineHours</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>0</code></li>
          <li class="numeric">Max. value: <code>1000000</code></li>
          <li>Forbidden for vehicleType <code>C</code> (car), <code>N</code> (caravan/mobile home) and <code>S</code> (snowmobile)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Engine operating hours.</p>
      </td>
      <td class="propExample"><p><code>1500</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-partiallistingpayload-enginemanufacturername"><p>engineManufacturerName</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Max. length: <code>200</code></li>
          <li>Forbidden for vehicleType <code>C</code> (car), <code>B</code> (bike), <code>X</code> (light commercial vehicle), <code>L</code> (trailer), <code>A</code> (agricultural), <code>E</code> (heavy equipment), <code>W</code> (personal watercraft) and <code>S</code> (snowmobile)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Engine manufacturer name.</p>
      </td>
      <td class="propExample"><p><code>Yamaha</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-partiallistingpayload-enginemountingtype"><p>engineMountingType</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li>Allowed values can be retrieved via the references API (reference type EngineMountingType)</li>
          <li>Forbidden for vehicleType <code>C</code> (car), <code>B</code> (bike), <code>X</code> (light commercial vehicle), <code>N</code> (caravan/mobile home), <code>L</code> (trailer), <code>A</code> (agricultural), <code>E</code> (heavy equipment), <code>W</code> (personal watercraft) and <code>S</code> (snowmobile)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Engine mounting type.</p>
      </td>
      <td class="propExample"><p><code>S</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-partiallistingpayload-equipment"><p>equipment</p></td>
      <td class="propType"><p>array[integer]</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li>Items must be unique</li>
          <li>Allowed values can be retrieved via the references API (reference type equipment)</li>
          <li>You are only allowed to send one Automatic Climate Control equipment for a given listing. Automatic climate control equipments include: (241) Automatic climate control 2 zones, (242) Automatic climate control 3 zones, (243) Automatic climate control, 4 zones and (30) Automatic climate control. If the vehicle has Automatic Climate Control but the number of zones is unknown, use (30) Automatic climate control.</li>
          <li>If the vehicle has a sliding door, but the side which the door is on is unknown use equipment (152) Sliding Door. If the side is known use (244) Sliding Door left, (245) Sliding Door right or both (if there are sliding doors on both sides). You are not allowed to send (152) sliding door, and (244)/(245) at the same time.</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>List of vehicle’s equipment.</p>
      </td>
      <td class="propExample"><p></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-partiallistingpayload-euemissionstandard"><p>euEmissionStandard</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li>Allowed values can be retrieved via the references API (reference type EuEmissionStandard)</li>
          <li>Forbidden for vehicleType <code>L</code> (trailer), <code>O</code> (boat), <code>W</code> (personal watercraft) and <code>S</code> (snowmobile)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>The EU emission standard indicates the amount of harmful substances the vehicle emits.</p>
        <p>The classification is in accordance with the European Standard Euronorm</p>
      </td>
      <td class="propExample"><p><code>1</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-partiallistingpayload-europalletstoragespaces"><p>europalletStorageSpaces</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li>Forbidden for vehicleType <code>C</code> (car), <code>B</code> (bike), <code>N</code> (caravan/mobile home), <code>A</code> (agricultural), <code>O</code> (boat), <code>W</code> (personal watercraft) and <code>S</code> (snowmobile)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>The number of europallets that can be transported by the vehicle.</p>
      </td>
      <td class="propExample"><p><code>5</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-partiallistingpayload-extendedlength"><p>extendedLength</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>1</code></li>
          <li class="numeric">Max. value: <code>50000</code></li>
          <li>Forbidden for vehicleType <code>C</code> (car), <code>B</code> (bike), <code>X</code> (light commercial vehicle), <code>L</code> (trailer), <code>A</code> (agricultural), <code>E</code> (heavy equipment), <code>O</code> (boat), <code>W</code> (personal watercraft) and <code>S</code> (snowmobile)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Extended length in millimeters.</p>
      </td>
      <td class="propExample"><p><code>8000</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-partiallistingpayload-exteriormaterial"><p>exteriorMaterial</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li>Allowed values can be retrieved via the references API (reference type ExteriorMaterial)</li>
          <li>Forbidden for vehicleType <code>C</code> (car), <code>B</code> (bike), <code>X</code> (light commercial vehicle), <code>L</code> (trailer), <code>A</code> (agricultural), <code>E</code> (heavy equipment), <code>O</code> (boat), <code>W</code> (personal watercraft) and <code>S</code> (snowmobile)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Exterior material type.</p>
      </td>
      <td class="propExample"><p><code>S</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-partiallistingpayload-externalcustomerid"><p>externalCustomerId</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>A customer id belonging to an external system.</p>
      </td>
      <td class="propExample"><p><code>1</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-partiallistingpayload-firstmodelsproductiondate"><p>firstModelsProductionDate</p></td>
      <td class="propType"><p>year-month</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>The date in which the first models of this vehicle were produced</p>
      </td>
      <td class="propExample"><p><code>2015-02</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-partiallistingpayload-firstregistrationdate"><p>firstRegistrationDate</p></td>
      <td class="propType"><p>year-month</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li>Mandatory for vehicleType <code>C</code> (car), <code>B</code> (Bike), <code>X</code> (light commercial vehicle) where offerType is  <code>J</code> (employee’s car), <code>O</code> (antique/classic), <code>S</code> (pre-registered), <code>U</code> (used)</li>
          <li>Must not be more than 24 months in the past  when vehicleType is <code>C</code> (car) and offerType = <code>J</code> (employee’s car)</li>
          <li>Must not be more than 12 months in the past when vehicleType is <code>C</code> (car) and OfferType = <code>S</code> (pre-registered).  This rule does not apply to Italian dealers</li>
          <li>Must be greater than 360 months (30 years) when vehicleType is <code>C</code> (car) and offerType is <code>O</code> (antique/classic)</li>
          <li>Must not be a date from the future set when OfferType = <code>J</code> (annual car) or OfferType = <code>O</code> (old timer).</li>
          <li>Note: Must not be less than <code>1886</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Month and year of first registration of the vehicle.</p>
      </td>
      <td class="propExample"><p><code>2015-01</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-partiallistingpayload-flooringmaterial"><p>flooringMaterial</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li>Allowed values can be retrieved via the references API (reference type Flooring)</li>
          <li>Forbidden for vehicleType <code>C</code> (car), <code>B</code> (bike), <code>X</code> (light commercial vehicle), <code>L</code> (trailer), <code>A</code> (agricultural), <code>E</code> (heavy equipment), <code>O</code> (boat), <code>W</code> (personal watercraft) and <code>S</code> (snowmobile)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Flooring material type.</p>
      </td>
      <td class="propExample"><p><code>S</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-partiallistingpayload-fridgecapacity"><p>fridgeCapacity</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>1</code></li>
          <li class="numeric">Max. value: <code>1000</code></li>
          <li>Forbidden for vehicleType <code>C</code> (car), <code>B</code> (bike), <code>X</code> (light commercial vehicle), <code>L</code> (trailer), <code>A</code> (agricultural), <code>E</code> (heavy equipment), <code>O</code> (boat), <code>W</code> (personal watercraft) and <code>S</code> (snowmobile)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Fridge capacity in liters.</p>
      </td>
      <td class="propExample"><p><code>100</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-partiallistingpayload-fridgecapacitymilliliters"><p>fridgeCapacityMilliliters</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>1000</code></li>
          <li class="numeric">Max. value: <code>1000000</code></li>
          <li>Forbidden for vehicleType <code>C</code> (car), <code>B</code> (bike), <code>X</code> (light commercial vehicle), <code>L</code> (trailer), <code>A</code> (agricultural), <code>E</code> (heavy equipment), <code>O</code> (boat), <code>W</code> (personal watercraft) and <code>S</code> (snowmobile)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Fridge capacity in milliliters.</p>
      </td>
      <td class="propExample"><p><code>100000</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-partiallistingpayload-fridgepowertype"><p>fridgePowerType</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li>Allowed values can be retrieved via the references API (reference type FridgePowerType)</li>
          <li>Forbidden for vehicleType <code>C</code> (car), <code>B</code> (bike), <code>X</code> (light commercial vehicle), <code>L</code> (trailer), <code>A</code> (agricultural), <code>E</code> (heavy equipment), <code>O</code> (boat), <code>W</code> (personal watercraft) and <code>S</code> (snowmobile)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Fridge power type.</p>
      </td>
      <td class="propExample"><p><code>E</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-partiallistingpayload-frontaxleweightrating"><p>frontAxleWeightRating</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>1</code></li>
          <li class="numeric">Max. value: <code>100000</code></li>
          <li>Forbidden for vehicleType <code>C</code> (car), <code>B</code> (bike), <code>N</code> (caravan/mobile home), <code>O</code> (boat), <code>W</code> (personal watercraft) and <code>S</code> (snowmobile)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Front axle weight rating in kilograms.</p>
      </td>
      <td class="propExample"><p><code>7500</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-partiallistingpayload-frontaxleweightratinggrams"><p>frontAxleWeightRatingGrams</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>1000</code></li>
          <li class="numeric">Max. value: <code>100000000</code></li>
          <li>Forbidden for vehicleType <code>C</code> (car), <code>B</code> (bike), <code>N</code> (caravan/mobile home), <code>O</code> (boat), <code>W</code> (personal watercraft) and <code>S</code> (snowmobile)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Front axle weight rating in grams.</p>
      </td>
      <td class="propExample"><p><code>7500000</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-partiallistingpayload-fuelcapacity"><p>fuelCapacity</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>1</code></li>
          <li class="numeric">Max. value: <code>1000</code></li>
          <li>Forbidden for vehicleType <code>C</code> (car), <code>B</code> (bike), <code>X</code> (light commercial vehicle), <code>N</code> (caravan/mobile home), <code>L</code> (trailer), <code>A</code> (agricultural), <code>E</code> (heavy equipment), <code>O</code> (boat) and <code>W</code> (personal watercraft)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Fuel capacity in liters.</p>
      </td>
      <td class="propExample"><p><code>200</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-partiallistingpayload-fuelcapacitymilliliters"><p>fuelCapacityMilliliters</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>1000</code></li>
          <li class="numeric">Max. value: <code>1000000</code></li>
          <li>Forbidden for vehicleType <code>C</code> (car), <code>B</code> (bike), <code>X</code> (light commercial vehicle), <code>N</code> (caravan/mobile home), <code>L</code> (trailer), <code>A</code> (agricultural), <code>E</code> (heavy equipment), <code>O</code> (boat) and <code>W</code> (personal watercraft)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Fuel capacity in milliliters.</p>
      </td>
      <td class="propExample"><p><code>200000</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-partiallistingpayload-fuelcategory"><p>fuelCategory</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li>Allowed values can be retrieved via the references API (reference type FuelCategory)</li>
          <li>Valid values for this reference type are dependent on the marketplace country of the customers.</li>
          <li>Forbidden for vehicleType <code>L</code> (trailer)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Category of fuel/energy source for the vehicle.</p>
      </td>
      <td class="propExample"><p><code>B</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-partiallistingpayload-fueldeliverytype"><p>fuelDeliveryType</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li>Allowed values can be retrieved via the references API (reference type FuelDeliveryType)</li>
          <li>Forbidden for vehicleType <code>C</code> (car), <code>X</code> (light commercial vehicle), <code>N</code> (caravan/mobile home), <code>L</code> (trailer), <code>A</code> (agricultural), <code>E</code> (heavy equipment), <code>O</code> (boat) and <code>W</code> (personal watercraft)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Fuel delivery type.</p>
      </td>
      <td class="propExample"><p><code>I</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-partiallistingpayload-gearcount"><p>gearCount</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>1</code></li>
          <li class="numeric">Max. value: <code>99</code></li>
          <li>Forbidden for vehicleType <code>L</code> (trailer)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Number of gears of the vehicle</p>
      </td>
      <td class="propExample"><p><code>6</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-partiallistingpayload-germanemissionssticker"><p>germanEmissionsSticker</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li>Allowed values can be retrieved via the references API (reference type EmissionsSticker)</li>
          <li>Forbidden for vehicleType <code>B</code> (bike), <code>L</code> (trailer), <code>O</code> (boat), <code>W</code> (personal watercraft) and <code>S</code> (snowmobile)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Emissions sticker type as assigned by German technical inspection authorities (Umweltplakette/Feinstaubplakette).</p>
      </td>
      <td class="propExample"><p><code>1</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-partiallistingpayload-grossvehicleweight"><p>grossVehicleWeight</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>1</code></li>
          <li>Forbidden for vehicleType <code>C</code> (car) and <code>B</code> (bike)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>The maximum operating weight of a vehicle measured in kg, including its chassis, body, engine, engine fluids, fuel, accessories, driver, passengers and cargo</p>
      </td>
      <td class="propExample"><p><code>3500</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-partiallistingpayload-grossvehicleweightgrams"><p>grossVehicleWeightGrams</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>1000</code></li>
          <li>Forbidden for vehicleType <code>C</code> (car) and <code>B</code> (bike)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>The maximum operating weight of a vehicle in grams, including its chassis, body, engine, engine fluids, fuel, accessories, driver, passengers and cargo.</p>
        <p>Use this field instead of grossVehicleWeight when submitting values in imperial units (lbs) to avoid rounding loss.</p>
      </td>
      <td class="propExample"><p><code>3500000</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-partiallistingpayload-hascarregistration"><p>hasCarRegistration</p></td>
      <td class="propType"><p>boolean</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li>Forbidden for vehicleType <code>C</code> (car), <code>B</code> (bike), <code>L</code> (trailer), <code>O</code> (boat), <code>W</code> (personal watercraft) and <code>S</code> (snowmobile)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Indicates whether a vehicle is registered as a car in the registration documents</p>
      </td>
      <td class="propExample"><p><code>false</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-partiallistingpayload-hasfullservicehistory"><p>hasFullServiceHistory</p></td>
      <td class="propType"><p>boolean</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Indicates whether vehicle has passed all periodic maintenance as recommended by the vehicle manufacturer.</p>
      </td>
      <td class="propExample"><p><code>false</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-partiallistingpayload-hasparticlefilter"><p>hasParticleFilter</p></td>
      <td class="propType"><p>boolean</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li>Forbidden for vehicleType <code>L</code> (trailer)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Indicates whether a diesel vehicle is equipped with a particle filter</p>
      </td>
      <td class="propExample"><p><code>true</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-partiallistingpayload-haswarranty"><p>hasWarranty</p></td>
      <td class="propType"><p>boolean</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li>This attribute only applies for customers that are dealers.</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Whether the vehicle has warranty.</p>
        <p>If warranty is set to 0 this can't be set to 'true'</p>
        <p>If warranty is set to > 0 this can't be set to 'false'</p>
      </td>
      <td class="propExample"><p><code>true</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-partiallistingpayload-headcount"><p>headCount</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>0</code></li>
          <li class="numeric">Max. value: <code>20</code></li>
          <li class="numeric">Min. value: <code>0</code></li>
          <li class="numeric">Max. value: <code>20</code></li>
          <li>Forbidden for vehicleType <code>C</code> (car), <code>B</code> (bike), <code>X</code> (light commercial vehicle), <code>N</code> (caravan/mobile home), <code>L</code> (trailer), <code>A</code> (agricultural), <code>E</code> (heavy equipment), <code>W</code> (personal watercraft) and <code>S</code> (snowmobile)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Total number of heads (bathrooms).</p>
      </td>
      <td class="propExample"><p><code>2</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-partiallistingpayload-hsn"><p>hsn</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. length: <code>4</code></li>
          <li class="numeric">Max. length: <code>4</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Herstellerschluesselnummer, or the unique identifier of vehicle manufacturer in Germany.</p>
        <p>In combination with TSN this key is used to uniquely identify a vehicle type.</p>
        <p>The make of a vehicle can be fully derived from this identifier.</p>
      </td>
      <td class="propExample"><p><code>0583</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-partiallistingpayload-hullmaterial"><p>hullMaterial</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li>Allowed values can be retrieved via the references API (reference type HullMaterial)</li>
          <li>Forbidden for vehicleType <code>C</code> (car), <code>B</code> (bike), <code>X</code> (light commercial vehicle), <code>N</code> (caravan/mobile home), <code>L</code> (trailer), <code>A</code> (agricultural), <code>E</code> (heavy equipment), <code>W</code> (personal watercraft) and <code>S</code> (snowmobile)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Hull material type.</p>
      </td>
      <td class="propExample"><p><code>S</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-partiallistingpayload-images"><p>images</p></td>
      <td class="propType"><p>array[<a href="#/data-models?id=imagepayload">ImagePayload</a>]</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Maximum number of items is 50</li>
          <li>Items must be unique</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>The images to associate with this listing.</p>
        <p>It will fully replace the previous associated images.</p>
        <p>Orphan images will be deleted immediately after the operation.</p>
      </td>
      <td class="propExample"><p></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-partiallistingpayload-images"><p>images</p></td>
      <td class="propType"><p>array[<a href="#/data-models?id=imagepayload">ImagePayload</a>]</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Maximum number of items is 50</li>
          <li>Items must be unique</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>The images to associate with this listing.</p>
        <p>It will fully replace the previous associated images.</p>
        <p>Orphan images will be deleted immediately after the operation.</p>
      </td>
      <td class="propExample"><p></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-partiallistingpayload-includedservices"><p>includedServices</p></td>
      <td class="propType"><p>array[integer]</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li>Items must be unique</li>
          <li>Allowed values can be retrieved via the references API (reference type IncludedService).</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Included services as part of the vehicle offer.</p>
        <p>Values <code>1</code> for German dealers (HU/AU) and <code>2</code> for Dutch dealers indicate that an inspection has been done recently and the vehicle is in a roadworthy state.</p>
      </td>
      <td class="propExample"><p></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-partiallistingpayload-iseureimport"><p>isEUReimport</p></td>
      <td class="propType"><p>boolean</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li>This attribute is only available for Smyle listings at the moment. Its value won't be considered valid and won't be displayed in the AutoScout24 websites. This is up to change in the future.</li>
          <li>Forbidden for vehicleType <code>O</code> (boat), <code>W</code> (personal watercraft) and <code>S</code> (snowmobile)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Whether the vehicle is EU reimported.</p>
      </td>
      <td class="propExample"><p><code>true</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-partiallistingpayload-ismetallic"><p>isMetallic</p></td>
      <td class="propType"><p>boolean</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li>Forbidden for vehicleType <code>L</code> (trailer)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Whether the vehicle’s body color has a metallic effect.</p>
      </td>
      <td class="propExample"><p><code>true</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-partiallistingpayload-isnonsmoking"><p>isNonSmoking</p></td>
      <td class="propType"><p>boolean</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li>Forbidden for vehicleType <code>L</code> (trailer) and <code>S</code> (snowmobile)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Whether the vehicle has been used by non-smokers only.</p>
      </td>
      <td class="propExample"><p><code>true</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-partiallistingpayload-ispluginhybrid"><p>isPluginHybrid</p></td>
      <td class="propType"><p>boolean</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li>If this property is set to <code>true</code>, then:</li>
          <li><code>primaryFuelType</code> OR <code>additionalFuelTypes</code> must contain <code>12</code> (Electric) AND <code>primaryFuelType</code> OR <code>additionalFuelTypes</code> must contain one fuel type != <code>12</code> (Electric)</li></li>
          <li><code>fuelCategory</code> must be one of <code>3</code> (Electric/Diesel), <code>2</code> (Electric/Benzin) or <code>O</code> Others</li></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Whether the vehicle is a plugin hybrid.</p>
      </td>
      <td class="propExample"><p><code>true</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-partiallistingpayload-isreserved"><p>isReserved</p></td>
      <td class="propType"><p>boolean</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li>This attribute is only available for Smyle listings at the moment. Its value won't be considered valid and won't be displayed in the AutoScout24 websites. This is up to change in the future.</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Whether the vehicle is reserved.</p>
      </td>
      <td class="propExample"><p><code>true</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-partiallistingpayload-lastcambeltservicedate"><p>lastCamBeltServiceDate</p></td>
      <td class="propType"><p>year-month</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li>Forbidden for vehicleType <code>L</code> (trailer)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Date of last cam belt exchange.</p>
        <p>Cannot be in the future.</p>
      </td>
      <td class="propExample"><p><code>2016-01</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-partiallistingpayload-lasttechnicalservicedate"><p>lastTechnicalServiceDate</p></td>
      <td class="propType"><p>year-month</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Date of last periodic maintenance</p>
      </td>
      <td class="propExample"><p><code>2016-06</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-partiallistingpayload-licenceplate"><p>licencePlate</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. length: <code>1</code></li>
          <li class="numeric">Max. length: <code>10</code></li>
          <li>Emails are forbidden in the content</li>
          <li>Forbidden characters are<code>&lt;</code> or <code>&gt;</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Licence plate number of the vehicle</p>
      </td>
      <td class="propExample"><p><code>M-2411-DC</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-partiallistingpayload-loadheight"><p>loadHeight</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>1</code></li>
          <li class="numeric">Min. value: <code>1</code></li>
          <li>Forbidden for vehicleType <code>C</code> (car), <code>B</code> (bike), <code>N</code> (caravan/mobile home), <code>O</code> (boat), <code>W</code> (personal watercraft) and <code>S</code> (snowmobile)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Maximum height of the load in millimeters</p>
      </td>
      <td class="propExample"><p><code>1900</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-partiallistingpayload-loadlength"><p>loadLength</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>1</code></li>
          <li class="numeric">Min. value: <code>1</code></li>
          <li>Forbidden for vehicleType <code>C</code> (car), <code>B</code> (bike), <code>N</code> (caravan/mobile home), <code>O</code> (boat), <code>W</code> (personal watercraft) and <code>S</code> (snowmobile)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Maximum length of the load in millimeters</p>
      </td>
      <td class="propExample"><p><code>3800</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-partiallistingpayload-loadvolume"><p>loadVolume</p></td>
      <td class="propType"><p>number</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li>Forbidden for vehicleType <code>C</code> (car), <code>B</code> (bike), <code>N</code> (caravan/mobile home), <code>O</code> (boat), <code>W</code> (personal watercraft) and <code>S</code> (snowmobile)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Maximum volume of the load in cubic meters</p>
      </td>
      <td class="propExample"><p><code>5.5</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-partiallistingpayload-loadwidth"><p>loadWidth</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>1</code></li>
          <li class="numeric">Min. value: <code>1</code></li>
          <li>Forbidden for vehicleType <code>C</code> (car), <code>B</code> (bike), <code>N</code> (caravan/mobile home), <code>O</code> (boat), <code>W</code> (personal watercraft) and <code>S</code> (snowmobile)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Maximum width of the load in millimeters</p>
      </td>
      <td class="propExample"><p><code>2100</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-partiallistingpayload-make"><p>make</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li>Allowed values can be retrieved via the makes API</li>
          <li>Mandatory for all listings</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Make identifier of the vehicle.</p>
      </td>
      <td class="propExample"><p><code>13</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-partiallistingpayload-marketing"><p>marketing</p></td>
      <td class="propType"><p><a href="#/data-models?id=partialmarketingpayload">PartialMarketingPayload</a></p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li>This attribute only applies for customers that are dealers.</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Provides additional marketing information</p>
      </td>
      <td class="propExample"><p></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-partiallistingpayload-maximumtowingweight"><p>maximumTowingWeight</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>1</code></li>
          <li class="numeric">Min. value: <code>1</code></li>
          <li>Forbidden for vehicleType <code>C</code> (car), <code>B</code> (bike), <code>L</code> (trailer), <code>O</code> (boat), <code>W</code> (personal watercraft) and <code>S</code> (snowmobile)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>The maximum weight the vehicle can tow in kg.</p>
      </td>
      <td class="propExample"><p><code>130</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-partiallistingpayload-mileage"><p>mileage</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li>Mandatory, and must be greater or equal than 0 when offerType is <code>J</code> (employee’s car), <code>S</code> (pre-registered), <code>O</code> (antique/classic), <code>U</code> (used) when vehicleType is C (car), B (bike) or X (light commercial vehicle)</li>
          <li>Optional for vehicleType <code>N</code> (caravan/mobile home)</li>
          <li>Forbidden for vehicleType <code>L</code> (trailer)</li>
          <li>Mileage must be less than 1000 when offerType is <code>N</code> (new)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>The distance in kilometers that the vehicle has run.</p>
      </td>
      <td class="propExample"><p><code>75000</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-partiallistingpayload-model"><p>model</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li>Allowed values can be retrieved via the makes API</li>
          <li>Mandatory for vehicleType <code>C</code> (car) and <code>B</code> (bike)</li>
          <li>Forbidden for vehicleType <code>X</code> (light commercial vehicle), <code>N</code> (caravan/mobile home), <code>L</code> (trailer), <code>A</code> (agricultural), <code>E</code> (heavy equipment), <code>O</code> (boat), <code>W</code> (personal watercraft) and <code>S</code> (snowmobile)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>The model of the vehicle (for cars and bikes)</p>
      </td>
      <td class="propExample"><p><code>1641</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-partiallistingpayload-modelname"><p>modelName</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Max. length: <code>50</code></li>
          <li>Mandatory for vehicleType <code>X</code> (light commercial vehicle), <code>N</code> (caravan/mobile home), <code>L</code> (trailer), <code>A</code> (agricultural), <code>E</code> (heavy equipment), <code>O</code> (boat) and <code>W</code> (personal watercraft)</li>
          <li>Mandatory for vehicleType <code>X</code> (light commercial vehicle), <code>N</code> (caravan/mobile home), <code>L</code> (trailer), <code>A</code> (agricultural), <code>E</code> (heavy equipment), <code>O</code> (boat), <code>W</code> (personal watercraft) and <code>S</code> (snowmobile)</li>
          <li>Forbidden for vehicleType <code>C</code> (car) and <code>B</code> (bike)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>The model of the vehicle (for Light Commercial Vehicles, Trailers, Caravans/Mobile homes)</p>
      </td>
      <td class="propExample"><p><code>Sprinter 310 Carlsen</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-partiallistingpayload-modelversion"><p>modelVersion</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. length: <code>1</code></li>
          <li class="numeric">Max. length: <code>121</code></li>
          <li>Emails are forbidden in the content</li>
          <li>Forbidden characters are<code>&lt;</code> or <code>&gt;</code></li>
          <li>Strings longer than 121 characters are accepted by the API but will be truncated to 121 characters.</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Additional information about the model.</p>
      </td>
      <td class="propExample"><p><code>Avant</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-partiallistingpayload-natcode"><p>natCode</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Max. length: <code>22</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Classification of makes and models given by Eurotax/Schwacke</p>
      </td>
      <td class="propExample"><p><code>20239429</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-partiallistingpayload-nextinspectiondate"><p>nextInspectionDate</p></td>
      <td class="propType"><p>year-month</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li>Must be within the next 5 years, or in the past 5 years.</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Date of next technical inspection as required by regulations.</p>
      </td>
      <td class="propExample"><p><code>2028-01</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-partiallistingpayload-offerreferenceid"><p>offerReferenceId</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. length: <code>1</code></li>
          <li class="numeric">Max. length: <code>50</code></li>
          <li>URLs are forbidden in the content</li>
          <li>Emails are forbidden in the content</li>
          <li>Forbidden characters are<code>&lt;</code> or <code>&gt;</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>A reference ID for the vehicle that can be used by buyers.</p>
        <p>Will be shown on the AutoScout24 plaform</p>
      </td>
      <td class="propExample"><p><code>A12453</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-partiallistingpayload-offertype"><p>offerType</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li>Allowed values can be retrieved via the references API (reference type OfferType)</li>
          <li>Allowed values for dealers (sellerType='Dealer'): [ Active, Inactive ]</li>
          <li>Allowed values for private sellers (sellerType='Private'): [ Active, Inactive, Draft ]</li>
          <li>Mandatory for all listings</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Specifies the offer type of the vehicle.</p>
      </td>
      <td class="propExample"><p><code>U</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-partiallistingpayload-oilcapacity"><p>oilCapacity</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>0</code></li>
          <li class="numeric">Max. value: <code>100</code></li>
          <li class="numeric">Min. value: <code>0</code></li>
          <li class="numeric">Max. value: <code>100</code></li>
          <li>Forbidden for vehicleType <code>C</code> (car), <code>B</code> (bike), <code>X</code> (light commercial vehicle), <code>N</code> (caravan/mobile home), <code>L</code> (trailer), <code>A</code> (agricultural), <code>E</code> (heavy equipment), <code>O</code> (boat) and <code>W</code> (personal watercraft)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Oil capacity in liters.</p>
      </td>
      <td class="propExample"><p><code>10</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-partiallistingpayload-oilcapacitymilliliters"><p>oilCapacityMilliliters</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>0</code></li>
          <li class="numeric">Max. value: <code>100000</code></li>
          <li class="numeric">Min. value: <code>0</code></li>
          <li class="numeric">Max. value: <code>100000</code></li>
          <li>Forbidden for vehicleType <code>C</code> (car), <code>B</code> (bike), <code>X</code> (light commercial vehicle), <code>N</code> (caravan/mobile home), <code>L</code> (trailer), <code>A</code> (agricultural), <code>E</code> (heavy equipment), <code>O</code> (boat) and <code>W</code> (personal watercraft)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Oil capacity in milliliters.</p>
      </td>
      <td class="propExample"><p><code>10000</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-partiallistingpayload-payload"><p>payload</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>0</code></li>
          <li>Forbidden for vehicleType <code>C</code> (car) and <code>B</code> (bike)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Maximum payload the vehicle can carry in kg.</p>
      </td>
      <td class="propExample"><p><code>2900</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-partiallistingpayload-power"><p>power</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>1</code></li>
          <li class="numeric">Max. value: <code>9999</code></li>
          <li>Forbidden for vehicleType <code>L</code> (trailer)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Engine power in kW. Power in (German) PS does not need to be specified, as it will automatically be derived from this value.</p>
      </td>
      <td class="propExample"><p><code>110</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-partiallistingpayload-previousownercount"><p>previousOwnerCount</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>0</code></li>
          <li class="numeric">Max. value: <code>99</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Number of previous vehicle owners.</p>
      </td>
      <td class="propExample"><p><code>1</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-partiallistingpayload-prices"><p>prices</p></td>
      <td class="propType"><p><a href="#/data-models?id=prices">Prices</a></p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li>Mandatory for EU market and private sellers. Optional only for Canadian dealers (sellerType='Dealer' and market='CA').</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Provides price information for the vehicle.</p>
      </td>
      <td class="propExample"><p></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-partiallistingpayload-primaryfueltype"><p>primaryFuelType</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li>Allowed values can be retrieved via the references API (reference type FuelType).</li>
          <li>Mandatory for German dealers when the vehicle type is <code>C</code> (Car) and the car is considered new (<code>mileage</code> <= 1000 and <code>firstRegistrationDate</code> <= 8 months).</li>
          <li>Forbidden for vehicleType <code>L</code> (trailer)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Fuel type with the lowest emission for the vehicle. This is derived from German emission/consumption regulations for vehicles (EnVKV).</p>
      </td>
      <td class="propExample"><p><code>1</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-partiallistingpayload-productionyear"><p>productionYear</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>The year when the vehicle was manufactured.</p>
      </td>
      <td class="propExample"><p><code>2014</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-partiallistingpayload-publication"><p>publication</p></td>
      <td class="propType"><p><a href="#/data-models?id=publicationpayload">PublicationPayload</a></p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li>Mandatory for all listings</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Provides information about the publication status of the listing</p>
      </td>
      <td class="propExample"><p></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-partiallistingpayload-rearaxleweightrating"><p>rearAxleWeightRating</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>1</code></li>
          <li class="numeric">Max. value: <code>100000</code></li>
          <li>Forbidden for vehicleType <code>C</code> (car), <code>B</code> (bike), <code>N</code> (caravan/mobile home), <code>O</code> (boat), <code>W</code> (personal watercraft) and <code>S</code> (snowmobile)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Rear axle weight rating in kilograms.</p>
      </td>
      <td class="propExample"><p><code>8500</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-partiallistingpayload-rearaxleweightratinggrams"><p>rearAxleWeightRatingGrams</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>1000</code></li>
          <li class="numeric">Max. value: <code>100000000</code></li>
          <li>Forbidden for vehicleType <code>C</code> (car), <code>B</code> (bike), <code>N</code> (caravan/mobile home), <code>O</code> (boat), <code>W</code> (personal watercraft) and <code>S</code> (snowmobile)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Rear axle weight rating in grams.</p>
      </td>
      <td class="propExample"><p><code>8500000</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-partiallistingpayload-requestedseals"><p>requestedSeals</p></td>
      <td class="propType"><p>array[integer]</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li>Items must be unique</li>
          <li>This attribute only applies for customers that are dealers.</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>List of IDs for the used vehicle seals granted for the vehicle.</p>
        <p>Available values for the customer can be retrieved using the getSealsForCustomer operation.</p>
        <p><strong>Note:</strong> If passed seals are not granted with vehicle, the system will ignore those values and create the listings.</p>
      </td>
      <td class="propExample"><p></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-partiallistingpayload-schwackecode"><p>schwackeCode</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Max. length: <code>22</code></li>
          <li>Forbidden for vehicleType <code>O</code> (boat) and <code>W</code> (personal watercraft)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Classification of makes and models given by Eurotax/Schwacke</p>
      </td>
      <td class="propExample"><p><code>20239429</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-partiallistingpayload-sealsoverwriteprotection"><p>sealsOverwriteProtection</p></td>
      <td class="propType"><p>boolean</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>It can be only set by dealers logging in through MLC. If set to true, the seals will not be overwritten with any update request from data providers.</p>
      </td>
      <td class="propExample"><p><code>true</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-partiallistingpayload-seatcount"><p>seatCount</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>1</code></li>
          <li class="numeric">Max. value: <code>99</code></li>
          <li>Forbidden for vehicleType <code>L</code> (trailer)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Number of seats of the vehicle</p>
      </td>
      <td class="propExample"><p><code>5</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-partiallistingpayload-skistancewidth"><p>skiStanceWidth</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>1</code></li>
          <li class="numeric">Max. value: <code>2000</code></li>
          <li>Forbidden for vehicleType <code>C</code> (car), <code>B</code> (bike), <code>X</code> (light commercial vehicle), <code>N</code> (caravan/mobile home), <code>L</code> (trailer), <code>A</code> (agricultural), <code>E</code> (heavy equipment), <code>O</code> (boat) and <code>W</code> (personal watercraft)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Ski stance width in millimeters.</p>
      </td>
      <td class="propExample"><p><code>1000</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-partiallistingpayload-slideoutcount"><p>slideOutCount</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>0</code></li>
          <li class="numeric">Max. value: <code>10</code></li>
          <li>Forbidden for vehicleType <code>C</code> (car), <code>B</code> (bike), <code>X</code> (light commercial vehicle), <code>L</code> (trailer), <code>A</code> (agricultural), <code>E</code> (heavy equipment), <code>O</code> (boat), <code>W</code> (personal watercraft) and <code>S</code> (snowmobile)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Number of slide-outs.</p>
      </td>
      <td class="propExample"><p><code>2</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-partiallistingpayload-steeringtype"><p>steeringType</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li>Allowed values can be retrieved via the references API (reference type SteeringType)</li>
          <li>Forbidden for vehicleType <code>C</code> (car), <code>B</code> (bike), <code>X</code> (light commercial vehicle), <code>N</code> (caravan/mobile home), <code>L</code> (trailer), <code>A</code> (agricultural), <code>E</code> (heavy equipment), <code>W</code> (personal watercraft) and <code>S</code> (snowmobile)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Steering type.</p>
      </td>
      <td class="propExample"><p><code>T</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-partiallistingpayload-totalheight"><p>totalHeight</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>1</code></li>
          <li>Forbidden for vehicleType <code>C</code> (car), <code>B</code> (bike), <code>X</code> (light commercial vehicle) and <code>L</code> (trailer)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Height of the vehicle in mm. Only available when vehicleType is <code>N</code>.</p>
      </td>
      <td class="propExample"><p><code>200</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-partiallistingpayload-totallength"><p>totalLength</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>1</code></li>
          <li>Forbidden for vehicleType <code>C</code> (car), <code>B</code> (bike), <code>X</code> (light commercial vehicle) and <code>L</code> (trailer)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Length of the vehicle in mm. Only available when vehicleType is <code>N</code>.</p>
      </td>
      <td class="propExample"><p><code>200</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-partiallistingpayload-totalwidth"><p>totalWidth</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>1</code></li>
          <li>Forbidden for vehicleType <code>C</code> (car), <code>B</code> (bike), <code>X</code> (light commercial vehicle) and <code>L</code> (trailer)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Width of the vehicle in mm. Only available when vehicleType is <code>N</code></p>
      </td>
      <td class="propExample"><p><code>200</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-partiallistingpayload-transmission"><p>transmission</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li>Allowed values can be retrieved via the references API (reference type Transmission).</li>
          <li>Valid values for this reference type are dependent on the marketplace country of the customers.</li>
          <li>Forbidden for vehicleType <code>L</code> (trailer)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Specifies the transmission type of the vehicle (e.g. manual, automatic).</p>
      </td>
      <td class="propExample"><p><code>M</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-partiallistingpayload-tsn"><p>tsn</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. length: <code>3</code></li>
          <li class="numeric">Max. length: <code>3</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Typschluesselnummer: Identifier used by vehicle manufacturers in Germany to specify a vehicle type.</p>
        <p>From TSN the following parameters can be derived: Model, body, engine type, fuel type etc.</p>
        <p>Combined with HSN a make/model combination can be fully specified.</p>
      </td>
      <td class="propExample"><p><code>936</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-partiallistingpayload-twinner"><p>twinner</p></td>
      <td class="propType"><p><a href="#/data-models?id=twinnerpayload">TwinnerPayload</a></p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Provides Twinner information for the vehicle.</p>
      </td>
      <td class="propExample"><p></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-partiallistingpayload-upholsterycolor"><p>upholsteryColor</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li>Allowed values can be retrieved via the references API (reference type InteriorColor)</li>
          <li>Forbidden for vehicleType <code>L</code> (trailer)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Basic color of vehicle’s interior. Used to enable search by basic interior color.</p>
      </td>
      <td class="propExample"><p><code>1</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-partiallistingpayload-upholsterytype"><p>upholsteryType</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li>Allowed values can be retrieved via the references API (reference type Upholstery)</li>
          <li>Forbidden for vehicleType <code>L</code> (trailer)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>The type of upholstery the vehicle has</p>
      </td>
      <td class="propExample"><p><code>AL</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-partiallistingpayload-vehicletype"><p>vehicleType</p></td>
      <td class="propType"><p><a href="#/data-models?id=vehicletypeid">VehicleTypeId</a></p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li>Mandatory for all listings</li>
          <li>Allowed values can be retrieved via the references API (reference type VehicleType).</li>
          <li>Valid values for this reference type are dependent on the marketplace country of the customers.</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>The type of vehicle being listed.</p>
      </td>
      <td class="propExample"><p></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-partiallistingpayload-vin"><p>vin</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. length: <code>17</code></li>
          <li class="numeric">Max. length: <code>17</code></li>
          <li>Emails are forbidden in the content</li>
          <li>Forbidden characters are<code>&lt;</code> or <code>&gt;</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Vehicle Identification Number. A unique international code including a serial number used to identify individual motor vehicles, towed vehicles and motorcycles</p>
      </td>
      <td class="propExample"><p><code>AB023475861123745</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-partiallistingpayload-warranty"><p>warranty</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>0</code></li>
          <li class="numeric">Max. value: <code>999</code></li>
          <li>This attribute only applies for customers that are dealers.</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Specifies the length in months of an additional warranty that is offered by the dealer.</p>
        <p>This warranty must be included in the vehicle price.</p>
        <p>If this field is not set, no warranty is provided</p>
      </td>
      <td class="propExample"><p><code>12</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-partiallistingpayload-wascaborrental"><p>wasCabOrRental</p></td>
      <td class="propType"><p>boolean</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li>Forbidden for vehicleType <code>B</code> (bike), <code>N</code> (caravan/mobile home), <code>L</code> (trailer) and <code>A</code> (agricultural)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Whether the vehicle has been used as cab or rental car or driving school car.</p>
      </td>
      <td class="propExample"><p><code>false</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-partiallistingpayload-wastetankcapacity"><p>wasteTankCapacity</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>0</code></li>
          <li class="numeric">Max. value: <code>10000</code></li>
          <li>Forbidden for vehicleType <code>C</code> (car), <code>B</code> (bike), <code>X</code> (light commercial vehicle), <code>L</code> (trailer), <code>A</code> (agricultural), <code>E</code> (heavy equipment), <code>O</code> (boat), <code>W</code> (personal watercraft) and <code>S</code> (snowmobile)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Waste tank capacity in liters.</p>
      </td>
      <td class="propExample"><p><code>100</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-partiallistingpayload-wastetankcapacitymilliliters"><p>wasteTankCapacityMilliliters</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>0</code></li>
          <li class="numeric">Max. value: <code>10000000</code></li>
          <li>Forbidden for vehicleType <code>C</code> (car), <code>B</code> (bike), <code>X</code> (light commercial vehicle), <code>L</code> (trailer), <code>A</code> (agricultural), <code>E</code> (heavy equipment), <code>O</code> (boat), <code>W</code> (personal watercraft) and <code>S</code> (snowmobile)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Waste tank capacity in milliliters.</p>
      </td>
      <td class="propExample"><p><code>100000</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-partiallistingpayload-watertankcapacity"><p>waterTankCapacity</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>0</code></li>
          <li class="numeric">Max. value: <code>1000</code></li>
          <li>Forbidden for vehicleType <code>C</code> (car), <code>B</code> (bike), <code>X</code> (light commercial vehicle), <code>L</code> (trailer), <code>A</code> (agricultural), <code>E</code> (heavy equipment), <code>O</code> (boat), <code>W</code> (personal watercraft) and <code>S</code> (snowmobile)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Water tank capacity in liters.</p>
      </td>
      <td class="propExample"><p><code>150</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-partiallistingpayload-watertankcapacitymilliliters"><p>waterTankCapacityMilliliters</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>0</code></li>
          <li class="numeric">Max. value: <code>1000000</code></li>
          <li>Forbidden for vehicleType <code>C</code> (car), <code>B</code> (bike), <code>X</code> (light commercial vehicle), <code>L</code> (trailer), <code>A</code> (agricultural), <code>E</code> (heavy equipment), <code>O</code> (boat), <code>W</code> (personal watercraft) and <code>S</code> (snowmobile)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Water tank capacity in milliliters.</p>
      </td>
      <td class="propExample"><p><code>150000</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-partiallistingpayload-wheelbase"><p>wheelbase</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>1</code></li>
          <li class="numeric">Min. value: <code>1</code></li>
          <li>Forbidden for vehicleType <code>C</code> (car), <code>B</code> (bike), <code>L</code> (trailer), <code>O</code> (boat), <code>W</code> (personal watercraft) and <code>S</code> (snowmobile)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>The distance between the centers of the front and rear wheels, measured in millimeters.</p>
      </td>
      <td class="propExample"><p><code>2800</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-partiallistingpayload-wltp"><p>wltp</p></td>
      <td class="propType"><p><a href="#/data-models?id=wltpcommon">WltpCommon</a></p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li>Forbidden for vehicleType <code>L</code> (trailer)</li>
          <li>Forbidden if NEDC consumption values are set (<code>consumption</code>, <code>co2Emissions</code> or <code>efficiencyClass</code>)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Provides WLTP consumption information.</p>
      </td>
      <td class="propExample"><p></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-partiallistingpayload-youtubevideourl"><p>youtubeVideoUrl</p></td>
      <td class="propType"><p>url</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. length: <code>1</code></li>
          <li class="numeric">Max. length: <code>256</code></li>
          <li>Must be a YouTube URL</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Youtube video for the vehicle.</p>
        <p>Videos from other platforms other than Youtube are not accepted</p>
      </td>
      <td class="propExample"><p><code>https://www.youtube.com/watch?v=wnKJnWRa_Ks</code></p></td>
    </tr>

  </tbody>
</table>


## PartialMarketingPayload
<table>
  <tbody>
    <tr>
      <th>Field name</th>
      <th>Type</th><th>Mandatory</th> <th>Other constraints</th>
      <th>Description</th>
      <th>Example</th>
    </tr>    <tr>
      <td class="propName" id="data-models-property-partialmarketingpayload-listingboost"><p>listingBoost</p></td>
      <td class="propType"><p><a href="#/data-models?id=partiallistingboostpayload">PartialListingBoostPayload</a></p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Provides a request for this listing to be a ListingBoost candidate.</p>
        <p>Should be set to TRUE if a ListingBoost is requested to apply, FALSE if it is requested to be removed, or NULL if no change is needed.</p>
      </td>
      <td class="propExample"><p></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-partialmarketingpayload-mia"><p>mia</p></td>
      <td class="propType"><p><a href="#/data-models?id=partialmiapayload">PartialMiaPayload</a></p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Provides a manual override for the MIA product for this listing</p>
      </td>
      <td class="propExample"><p></p></td>
    </tr>

  </tbody>
</table>


## PartialMiaPayload
<table>
  <tbody>
    <tr>
      <th>Field name</th>
      <th>Type</th><th>Mandatory</th> <th>Other constraints</th>
      <th>Description</th>
      <th>Example</th>
    </tr>    <tr>
      <td class="propName" id="data-models-property-partialmiapayload-requestedtier"><p>requestedTier</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li>Allowed values are: <code>T20</code>, <code>T30</code>, <code>T40</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>The required tier for the MIA vehicle.</p>
      </td>
      <td class="propExample"><p><code>T30</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-partialmiapayload-subtitle"><p>subtitle</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>The subtitle for the MIA vehicle.</p>
      </td>
      <td class="propExample"><p><code>MIA T30</code></p></td>
    </tr>

  </tbody>
</table>


## Price
<table>
  <tbody>
    <tr>
      <th>Field name</th>
      <th>Type</th><th>Mandatory</th> <th>Other constraints</th>
      <th>Description</th>
      <th>Example</th>
    </tr>    <tr>
      <td class="propName" id="data-models-property-price-currency"><p>currency</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>Yes</p></td>      <td class="propConstraints">
        <ul>
          <li>Allowed values are: <code>EUR</code>, <code>CAD</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Currency for given price. Validated against values allowed for the Dealer Marketplace.</p>
      </td>
      <td class="propExample"><p><code>EUR</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-price-price"><p>price</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>Yes</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>1</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Gross price for the vehicle</p>
      </td>
      <td class="propExample"><p><code>16500</code></p></td>
    </tr>

  </tbody>
</table>


## PriceEvaluationRanges
<table>
  <tbody>
    <tr>
      <th>Field name</th>
      <th>Type</th><th>Mandatory</th> <th>Other constraints</th>
      <th>Description</th>
      <th>Example</th>
    </tr>    <tr>
      <td class="propName" id="data-models-property-priceevaluationranges-category"><p>category</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>The price label category index, can be mapped using the references endpoint for the reference type PriceLabel.</p>
      </td>
      <td class="propExample"><p><code>1</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-priceevaluationranges-maximum"><p>maximum</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>The inclusive maximum price for this listing to be in this price range.</p>
      </td>
      <td class="propExample"><p><code>13500</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-priceevaluationranges-minimum"><p>minimum</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>The inclusive minimum price for this listing to be in this price range.</p>
      </td>
      <td class="propExample"><p><code>10500</code></p></td>
    </tr>

  </tbody>
</table>


## PriceEvaluationResponse
<table>
  <tbody>
    <tr>
      <th>Field name</th>
      <th>Type</th><th>Mandatory</th> <th>Other constraints</th>
      <th>Description</th>
      <th>Example</th>
    </tr>    <tr>
      <td class="propName" id="data-models-property-priceevaluationresponse-category"><p>category</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>The price label category id, as defined by the `PriceLabel` reference type in the GET /references API.</p>
      </td>
      <td class="propExample"><p><code>1</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-priceevaluationresponse-ranges"><p>ranges</p></td>
      <td class="propType"><p>array[<a href="#/data-models?id=priceevaluationranges">PriceEvaluationRanges</a>]</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>The price label ranges of the listing.</p>
      </td>
      <td class="propExample"><p></p></td>
    </tr>

  </tbody>
</table>


## Prices
<table>
  <tbody>
    <tr>
      <th>Field name</th>
      <th>Type</th><th>Mandatory</th> <th>Other constraints</th>
      <th>Description</th>
      <th>Example</th>
    </tr>    <tr>
      <td class="propName" id="data-models-property-prices-dealer"><p>dealer</p></td>
      <td class="propType"><p><a href="#/data-models?id=dealerprice">DealerPrice</a></p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>The price of the vehicle when offered to dealers. Only shown in the dealer Marketplace.</p>
      </td>
      <td class="propExample"><p></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-prices-manufacturerssuggestedretail"><p>manufacturersSuggestedRetail</p></td>
      <td class="propType"><p><a href="#/data-models?id=retailprice">RetailPrice</a></p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>The retail price of the vehicle as suggested by its manufacturer</p>
      </td>
      <td class="propExample"><p></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-prices-public"><p>public</p></td>
      <td class="propType"><p><a href="#/data-models?id=publicprice">PublicPrice</a></p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Gross price for the vehicle, including VAT and any other applicable taxes.</p>
        <p>This price will be shown to the AutoScout24 users.</p>
      </td>
      <td class="propExample"><p></p></td>
    </tr>

  </tbody>
</table>


## ProductsConfiguration
<table>
  <tbody>
    <tr>
      <th>Field name</th>
      <th>Type</th><th>Mandatory</th> <th>Other constraints</th>
      <th>Description</th>
      <th>Example</th>
    </tr>    <tr>
      <td class="propName" id="data-models-property-productsconfiguration-autoproff"><p>autoProff</p></td>
      <td class="propType"><p><a href="#/data-models?id=autoproffconfiguration">AutoProffConfiguration</a></p></td><td class="propMandatory"><p>Yes</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>AutoProff marketplace configuration for the customer</p>
      </td>
      <td class="propExample"><p></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-productsconfiguration-selectboost"><p>selectBoost</p></td>
      <td class="propType"><p><a href="#/data-models?id=selectboostconfiguration">SelectBoostConfiguration</a></p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>SelectBoost configuration for the customer</p>
      </td>
      <td class="propExample"><p></p></td>
    </tr>

  </tbody>
</table>


## PublicPrice
<table>
  <tbody>
    <tr>
      <th>Field name</th>
      <th>Type</th><th>Mandatory</th> <th>Other constraints</th>
      <th>Description</th>
      <th>Example</th>
    </tr>    <tr>
      <td class="propName" id="data-models-property-publicprice-currency"><p>currency</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>Yes</p></td>      <td class="propConstraints">
        <ul>
          <li>Allowed values are: <code>EUR</code>, <code>CAD</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Currency for given price. Validated against values allowed for the Dealer Marketplace.</p>
      </td>
      <td class="propExample"><p><code>EUR</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-publicprice-germanenvironmentalgrant"><p>germanEnvironmentalGrant</p></td>
      <td class="propType"><p><a href="#/data-models?id=discount">Discount</a></p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>A one-time reimbursement a consumer can apply for. If priceAlreadyDiscounted is true, then the price / monthly rate is already calculated including this discount. If priceAlreadyDiscounted is false, then the price / monthly rate does not take the grant into account, but can be lowered by applying this discount.</p>
      </td>
      <td class="propExample"><p></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-publicprice-isnegotiable"><p>isNegotiable</p></td>
      <td class="propType"><p>boolean</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Indicates whether a given price is negotiable</p>
      </td>
      <td class="propExample"><p><code>false</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-publicprice-istaxdeductible"><p>isTaxDeductible</p></td>
      <td class="propType"><p>boolean</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Indicates whether value added tax amount can be shown in invoice</p>
      </td>
      <td class="propExample"><p><code>true</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-publicprice-netprice"><p>netPrice</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>1</code></li>
          <li>Must be less than <code>price</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Net price for the vehicle</p>
      </td>
      <td class="propExample"><p><code>15300</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-publicprice-price"><p>price</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>Yes</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>1</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Gross price for the vehicle</p>
      </td>
      <td class="propExample"><p><code>16500</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-publicprice-vatrate"><p>vatRate</p></td>
      <td class="propType"><p>number</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>0</code></li>
          <li class="numeric">Max. value: <code>100</code></li>
          <li>Only 1 decimal is accepted. If more decimals are sent they will be truncated.</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>The value added tax rate.</p>
      </td>
      <td class="propExample"><p><code>17</code></p></td>
    </tr>

  </tbody>
</table>


## Publication
<table>
  <tbody>
    <tr>
      <th>Field name</th>
      <th>Type</th><th>Mandatory</th> <th>Other constraints</th>
      <th>Description</th>
      <th>Example</th>
    </tr>    <tr>
      <td class="propName" id="data-models-property-publication-channels"><p>channels</p></td>
      <td class="propType"><p>array[<a href="#/data-models?id=channel">Channel</a>]</p></td><td class="propMandatory"><p>Yes</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>A channel to publish the listing to; publishing to the channel <code>AS24</code> implicitly publishes to <code>AS24Dealer</code> channel. Publishing to the channel <code>mobile_de</code> marks listings as eligible for export to mobile.de if the customer has opted-in to selective mobile.de export handling. If a customer has not opted-in (which is the default) but has an export to mobile.de configured, then all listings will be exported.</p>
      </td>
      <td class="propExample"><p></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-publication-status"><p>status</p></td>
      <td class="propType"><p><a href="#/data-models?id=publicationstatus">PublicationStatus</a></p></td><td class="propMandatory"><p>Yes</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>the status of the publication</p>
      </td>
      <td class="propExample"><p></p></td>
    </tr>

  </tbody>
</table>


## PublicationPayload
<table>
  <tbody>
    <tr>
      <th>Field name</th>
      <th>Type</th><th>Mandatory</th> <th>Other constraints</th>
      <th>Description</th>
      <th>Example</th>
    </tr>    <tr>
      <td class="propName" id="data-models-property-publicationpayload-channels"><p>channels</p></td>
      <td class="propType"><p>array[<a href="#/data-models?id=channelreference">ChannelReference</a>]</p></td><td class="propMandatory"><p>Yes</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>a channel to publish the listing to.</p>
      </td>
      <td class="propExample"><p></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-publicationpayload-status"><p>status</p></td>
      <td class="propType"><p><a href="#/data-models?id=publicationstatus">PublicationStatus</a></p></td><td class="propMandatory"><p>Yes</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>the status of the publication</p>
      </td>
      <td class="propExample"><p></p></td>
    </tr>

  </tbody>
</table>


## PublicationStatus
<table>
  <tbody>
    <tr>
      <th>Field name</th>
      <th>Type</th><th>Mandatory</th> <th>Other constraints</th>
      <th>Description</th>
      <th>Example</th>
    </tr>    <tr>
      <td class="propName" id="data-models-property-publicationstatus--"><p>-</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li>Allowed values are: <code>Active</code>, <code>Inactive</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Indicates whether a listing is published or unpublished</p>
      </td>
      <td class="propExample"><p><code>Inactive</code></p></td>
    </tr>

  </tbody>
</table>


## Reference
<table>
  <tbody>
    <tr>
      <th>Field name</th>
      <th>Type</th><th>Mandatory</th> <th>Other constraints</th>
      <th>Description</th>
      <th>Example</th>
    </tr>    <tr>
      <td class="propName" id="data-models-property-reference-country"><p>country</p></td>
      <td class="propType"><p>array[string]</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>The countries to which this reference applies.</p>
      </td>
      <td class="propExample"><p></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-reference-id"><p>id</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>Yes</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>A unique identifier of this reference. This value is unique within its reference type</p>
      </td>
      <td class="propExample"><p><code>1</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-reference-name"><p>name</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>Yes</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>the name of the given reference in English</p>
      </td>
      <td class="propExample"><p><code>Compact</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-reference-referencetype"><p>referenceType</p></td>
      <td class="propType"><p><a href="#/data-models?id=referencetype">ReferenceType</a></p></td><td class="propMandatory"><p>Yes</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>The type of reference</p>
      </td>
      <td class="propExample"><p></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-reference-vehicletype"><p>vehicleType</p></td>
      <td class="propType"><p>array[<a href="#/data-models?id=vehicletypeid">VehicleTypeId</a>]</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>The vehicle types to which this reference applies.</p>
      </td>
      <td class="propExample"><p></p></td>
    </tr>

  </tbody>
</table>


## ReferenceType
<table>
  <tbody>
    <tr>
      <th>Field name</th>
      <th>Type</th><th>Mandatory</th> <th>Other constraints</th>
      <th>Description</th>
      <th>Example</th>
    </tr>    <tr>
      <td class="propName" id="data-models-property-referencetype--"><p>-</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li>Allowed values are: <code>AvailabilityType</code>, <code>BatteryOwnershipType</code>, <code>BidirectionalChargingType</code>, <code>BedType</code>, <code>BodyColor</code>, <code>BodyType</code>, <code>BrakeType</code>, <code>Co2Class</code>, <code>Country</code>, <code>DebitInterestType</code>, <code>Drivetrain</code>, <code>EfficiencyClass</code>, <code>EngineCoolingSystem</code>, <code>EngineMountingType</code>, <code>Equipment</code>, <code>EuEmissionStandard</code>, <code>Flooring</code>, <code>FridgePowerType</code>, <code>FuelCategory</code>, <code>FuelDeliveryType</code>, <code>FuelType</code>, <code>GermanEmissionsSticker</code>, <code>IncludedService</code>, <code>Material</code>, <code>OfferType</code>, <code>PlugType</code>, <code>PriceLabel</code>, <code>Steering</code>, <code>Transmission</code>, <code>UpholsteryColor</code>, <code>UpholsteryType</code>, <code>VehicleType</code>, <code>InventoryTag</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>the type of reference</p>
      </td>
      <td class="propExample"><p><code>BodyType</code></p></td>
    </tr>

  </tbody>
</table>


## References
<table>
  <tbody>
    <tr>
      <th>Field name</th>
      <th>Type</th><th>Mandatory</th> <th>Other constraints</th>
      <th>Description</th>
      <th>Example</th>
    </tr>    <tr>
      <td class="propName" id="data-models-property-references-references"><p>references</p></td>
      <td class="propType"><p>array[<a href="#/data-models?id=reference">Reference</a>]</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>a set of references</p>
      </td>
      <td class="propExample"><p></p></td>
    </tr>

  </tbody>
</table>


## RetailPrice
<table>
  <tbody>
    <tr>
      <th>Field name</th>
      <th>Type</th><th>Mandatory</th> <th>Other constraints</th>
      <th>Description</th>
      <th>Example</th>
    </tr>    <tr>
      <td class="propName" id="data-models-property-retailprice-currency"><p>currency</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>Yes</p></td>      <td class="propConstraints">
        <ul>
          <li>Allowed values are: <code>EUR</code>, <code>CAD</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Currency for given price. Validated against values allowed for the Dealer Marketplace.</p>
      </td>
      <td class="propExample"><p><code>EUR</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-retailprice-price"><p>price</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>Yes</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>1</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Gross price for the vehicle</p>
      </td>
      <td class="propExample"><p><code>16500</code></p></td>
    </tr>

  </tbody>
</table>


## Seal
<table>
  <tbody>
    <tr>
      <th>Field name</th>
      <th>Type</th><th>Mandatory</th> <th>Other constraints</th>
      <th>Description</th>
      <th>Example</th>
    </tr>    <tr>
      <td class="propName" id="data-models-property-seal-classid"><p>classId</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>The class of the seal</p>
      </td>
      <td class="propExample"><p><code>1</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-seal-country"><p>country</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>Yes</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>country for given seal (as ISO code)</p>
      </td>
      <td class="propExample"><p><code>NL-nl</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-seal-defaultset"><p>defaultSet</p></td>
      <td class="propType"><p>boolean</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Whether the seal is set by default</p>
      </td>
      <td class="propExample"><p><code>false</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-seal-id"><p>id</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>Yes</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>an identifier of the seal</p>
      </td>
      <td class="propExample"><p><code>10</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-seal-image"><p>image</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>URL to the image of the seal</p>
      </td>
      <td class="propExample"><p><code>https://prod.pictures.autoscout24.net/seals/10.jpg</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-seal-info"><p>info</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>URL to the information page of the seal</p>
      </td>
      <td class="propExample"><p><code>https://www.autoscout24.nl/best-car-selection</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-seal-manuallyeditable"><p>manuallyEditable</p></td>
      <td class="propType"><p>boolean</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Whether the seal can be manually edited by the dealer</p>
      </td>
      <td class="propExample"><p><code>false</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-seal-name"><p>name</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>Yes</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>the name of given seal</p>
      </td>
      <td class="propExample"><p><code>Best Car Selection</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-seal-thumbnail"><p>thumbnail</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>URL to the thumbnail image of the seal</p>
      </td>
      <td class="propExample"><p><code>https://prod.pictures.autoscout24.net/seals/10.jpg</code></p></td>
    </tr>

  </tbody>
</table>


## Seals
<table>
  <tbody>
    <tr>
      <th>Field name</th>
      <th>Type</th><th>Mandatory</th> <th>Other constraints</th>
      <th>Description</th>
      <th>Example</th>
    </tr>    <tr>
      <td class="propName" id="data-models-property-seals-seals"><p>seals</p></td>
      <td class="propType"><p>array[<a href="#/data-models?id=seal">Seal</a>]</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>a set of seals</p>
      </td>
      <td class="propExample"><p></p></td>
    </tr>

  </tbody>
</table>


## SelectBoostConfiguration
<table>
  <tbody>
    <tr>
      <th>Field name</th>
      <th>Type</th><th>Mandatory</th> <th>Other constraints</th>
      <th>Description</th>
      <th>Example</th>
    </tr>    <tr>
      <td class="propName" id="data-models-property-selectboostconfiguration-activationmode"><p>activationMode</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>Yes</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Indicates how SelectBoost can be activated for the customer.</p>
        <p>Possible values:</p>
        <p>- "Automatic" when included units are available</p>
        <p>- "Manual" when SelectBoost is available but no included units are configured</p>
        <p>- "Inactive" when SelectBoost is inactive</p>
      </td>
      <td class="propExample"><p><code>Automatic</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-selectboostconfiguration-includedunits"><p>includedUnits</p></td>
      <td class="propType"><p>int64</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Included SelectBoost units for automatic activation.</p>
      </td>
      <td class="propExample"><p><code>10</code></p></td>
    </tr>

  </tbody>
</table>


## ThreeSixtyImagesCollection
<table>
  <tbody>
    <tr>
      <th>Field name</th>
      <th>Type</th><th>Mandatory</th> <th>Other constraints</th>
      <th>Description</th>
      <th>Example</th>
    </tr>    <tr>
      <td class="propName" id="data-models-property-threesixtyimagescollection-id"><p>id</p></td>
      <td class="propType"><p>guid</p></td><td class="propMandatory"><p>Yes</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>The image identifier</p>
      </td>
      <td class="propExample"><p><code>269e6ae5-a49b-4ea5-85a2-9c2093c26287</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-threesixtyimagescollection-images"><p>images</p></td>
      <td class="propType"><p>array[<a href="#/data-models?id=threesixtyimagescollectionimagepayload">ThreeSixtyImagesCollectionImagePayload</a>]</p></td><td class="propMandatory"><p>Yes</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Maximum number of items is 75</li>
          <li class="numeric">Minimum number of items is 4</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>The list of images that compose the 360 image, in order of visualization.</p>
      </td>
      <td class="propExample"><p></p></td>
    </tr>

  </tbody>
</table>


## ThreeSixtyImagesCollectionImage
<table>
  <tbody>
    <tr>
      <th>Field name</th>
      <th>Type</th><th>Mandatory</th> <th>Other constraints</th>
      <th>Description</th>
      <th>Example</th>
    </tr>    <tr>
      <td class="propName" id="data-models-property-threesixtyimagescollectionimage-id"><p>id</p></td>
      <td class="propType"><p>guid</p></td><td class="propMandatory"><p>Yes</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>The image identifier</p>
      </td>
      <td class="propExample"><p><code>269e6ae5-a49b-4ea5-85a2-9c2093c26287</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-threesixtyimagescollectionimage-md5"><p>md5</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>The unique MD5 hash identifier for image</p>
      </td>
      <td class="propExample"><p><code>bb3da223907cbe437bab4cf2e7343d61</code></p></td>
    </tr>

  </tbody>
</table>


## ThreeSixtyImagesCollectionImagePayload
<table>
  <tbody>
    <tr>
      <th>Field name</th>
      <th>Type</th><th>Mandatory</th> <th>Other constraints</th>
      <th>Description</th>
      <th>Example</th>
    </tr>    <tr>
      <td class="propName" id="data-models-property-threesixtyimagescollectionimagepayload-id"><p>id</p></td>
      <td class="propType"><p>guid</p></td><td class="propMandatory"><p>Yes</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>The image identifier</p>
      </td>
      <td class="propExample"><p><code>269e6ae5-a49b-4ea5-85a2-9c2093c26287</code></p></td>
    </tr>

  </tbody>
</table>


## ThreeSixtyImagesCollectionPayload
<table>
  <tbody>
    <tr>
      <th>Field name</th>
      <th>Type</th><th>Mandatory</th> <th>Other constraints</th>
      <th>Description</th>
      <th>Example</th>
    </tr>    <tr>
      <td class="propName" id="data-models-property-threesixtyimagescollectionpayload-images"><p>images</p></td>
      <td class="propType"><p>array[<a href="#/data-models?id=threesixtyimagescollectionimagepayload">ThreeSixtyImagesCollectionImagePayload</a>]</p></td><td class="propMandatory"><p>Yes</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Maximum number of items is 75</li>
          <li class="numeric">Minimum number of items is 4</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>The list of images that compose the 360 image, in order of visualization.</p>
      </td>
      <td class="propExample"><p></p></td>
    </tr>

  </tbody>
</table>


## ThreeSixtyImagesCollections
<table>
  <tbody>
    <tr>
      <th>Field name</th>
      <th>Type</th><th>Mandatory</th> <th>Other constraints</th>
      <th>Description</th>
      <th>Example</th>
    </tr>    <tr>
      <td class="propName" id="data-models-property-threesixtyimagescollections-images"><p>images</p></td>
      <td class="propType"><p>array[<a href="#/data-models?id=threesixtyimagescollection">ThreeSixtyImagesCollection</a>]</p></td><td class="propMandatory"><p>Yes</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>list of all images of type <code>ThreeSixtyImagesCollection</code> for the listing</p>
      </td>
      <td class="propExample"><p></p></td>
    </tr>

  </tbody>
</table>


## ThreeSixtyVr
<table>
  <tbody>
    <tr>
      <th>Field name</th>
      <th>Type</th><th>Mandatory</th> <th>Other constraints</th>
      <th>Description</th>
      <th>Example</th>
    </tr>    <tr>
      <td class="propName" id="data-models-property-threesixtyvr-format"><p>format</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li>Allowed values are: <code>Equirectangular</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>the format of the VR image</p>
      </td>
      <td class="propExample"><p><code>Equirectangular</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-threesixtyvr-id"><p>id</p></td>
      <td class="propType"><p>guid</p></td><td class="propMandatory"><p>Yes</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>The image identifier</p>
      </td>
      <td class="propExample"><p><code>269e6ae5-a49b-4ea5-85a2-9c2093c26287</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-threesixtyvr-md5"><p>md5</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>The unique MD5 hash identifier for image</p>
      </td>
      <td class="propExample"><p><code>bb3da223907cbe437bab4cf2e7343d61</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-threesixtyvr-previewurl"><p>previewUrl</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>the URL of the highest resolution version of the image</p>
      </td>
      <td class="propExample"><p><code>https://prod.pictures.autoscout24.net/listing-images/d0b91f24-68c2-4683-b575-db510e97fc2d_e5079988-9e05-43f0-8cba-6f37e6f1de28.jpg</code></p></td>
    </tr>

  </tbody>
</table>


## ThreeSixtyVrs
<table>
  <tbody>
    <tr>
      <th>Field name</th>
      <th>Type</th><th>Mandatory</th> <th>Other constraints</th>
      <th>Description</th>
      <th>Example</th>
    </tr>    <tr>
      <td class="propName" id="data-models-property-threesixtyvrs-images"><p>images</p></td>
      <td class="propType"><p>array[<a href="#/data-models?id=threesixtyvr">ThreeSixtyVr</a>]</p></td><td class="propMandatory"><p>Yes</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>list of all images of type ThreeSixtyVr for the listing</p>
      </td>
      <td class="propExample"><p></p></td>
    </tr>

  </tbody>
</table>


## Tier
<table>
  <tbody>
    <tr>
      <th>Field name</th>
      <th>Type</th><th>Mandatory</th> <th>Other constraints</th>
      <th>Description</th>
      <th>Example</th>
    </tr>    <tr>
      <td class="propName" id="data-models-property-tier--"><p>-</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li>Allowed values are: <code>T20</code>, <code>T30</code>, <code>T40</code>, <code>T50</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>The tier increases the priority and visibility of a listing in the search results.</p>
        <p>Available tier levels are: <code>T20</code> (PlusInserat/Optimum…), <code>T30</code> (PremiumInserat/Premium), <code>T40</code> (PlatinumInserat/Platinum), <code>T50</code> (SalesTurbo)</p>
      </td>
      <td class="propExample"><p><code>T20</code></p></td>
    </tr>

  </tbody>
</table>


## TwinnerPayload
<table>
  <tbody>
    <tr>
      <th>Field name</th>
      <th>Type</th><th>Mandatory</th> <th>Other constraints</th>
      <th>Description</th>
      <th>Example</th>
    </tr>    <tr>
      <td class="propName" id="data-models-property-twinnerpayload-key"><p>key</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>The url as retrieved from Twinner</p>
      </td>
      <td class="propExample"><p><code>https://data.twinner.com/displaydata/20211210/102/121021_d3ebf51e-1a07-4d97-b0f2-d830bb8601b3/</code></p></td>
    </tr>

  </tbody>
</table>


## VehicleTypeId
<table>
  <tbody>
    <tr>
      <th>Field name</th>
      <th>Type</th><th>Mandatory</th> <th>Other constraints</th>
      <th>Description</th>
      <th>Example</th>
    </tr>    <tr>
      <td class="propName" id="data-models-property-vehicletypeid--"><p>-</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li>Allowed values are: <code>C</code>, <code>B</code>, <code>N</code>, <code>X</code>, <code>L</code>, <code>A</code>, <code>E</code>, <code>O</code>, <code>S</code>, <code>W</code></li>
          <li>Allowed values for a marketplace can be retrieved via the references API (reference type VehicleType)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>A type of vehicle.</p>
        <p>We currently support: <code>C</code> (cars), <code>B</code> (bikes), <code>X</code> (light commercial vehicle), <code>N</code> (caravan/mobile home), <code>L</code> (trailer), <code>A</code> (agricultural machine), <code>E</code> (heavy equipment), <code>O</code> (boat), <code>S</code> (snowmobile), <code>W</code> (personal watercraft)</p>
      </td>
      <td class="propExample"><p><code>C</code></p></td>
    </tr>

  </tbody>
</table>


## VinEnrichmentStatus
<table>
  <tbody>
    <tr>
      <th>Field name</th>
      <th>Type</th><th>Mandatory</th> <th>Other constraints</th>
      <th>Description</th>
      <th>Example</th>
    </tr>    <tr>
      <td class="propName" id="data-models-property-vinenrichmentstatus--"><p>-</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li>Allowed values are: <code>Processing</code>, <code>Success</code>, <code>Fail</code></li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Indicates the status of enrichment</p>
      </td>
      <td class="propExample"><p><code>Success</code></p></td>
    </tr>

  </tbody>
</table>


## WltpCommon
<table>
  <tbody>
    <tr>
      <th>Field name</th>
      <th>Type</th><th>Mandatory</th> <th>Other constraints</th>
      <th>Description</th>
      <th>Example</th>
    </tr>    <tr>
      <td class="propName" id="data-models-property-wltpcommon-co2class"><p>co2Class</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li>Allowed values can be retrieved via the references API (reference type Co2Class)</li>
          <li>Mandatory for German dealers when vehicleType is <code>C</code> and the car is considered new (<code>mileage</code> <= 1000 and <code>firstRegistrationDate</code> <= 8 months).</li>
          <li>Forbidden for vehicleType <code>L</code> (trailer)</li>
          <li>Forbidden if NEDC consumption values are set (<code>consumption</code>, <code>co2Emissions</code> or <code>efficiencyClass</code>)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Vehicles co2 class.</p>
      </td>
      <td class="propExample"><p><code>10 (meaning A)</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-wltpcommon-co2classdischarged"><p>co2ClassDischarged</p></td>
      <td class="propType"><p>integer</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li>Allowed values can be retrieved via the references API (reference type Co2Class)</li>
          <li>Mandatory for German dealers and plug in hybrids when vehicleType is <code>C</code> and the car is considered new (<code>mileage</code> <= 1000 and <code>firstRegistrationDate</code> <= 8 months).</li>
          <li>Forbidden for vehicleType <code>L</code> (trailer)</li>
          <li>Forbidden if NEDC consumption values are set (<code>consumption</code>, <code>co2Emissions</code> or <code>efficiencyClass</code>)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>Plug-In-Hybrid co2 class for discharged battery.</p>
      </td>
      <td class="propExample"><p><code>10 (meaning A)</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-wltpcommon-co2emissionscombined"><p>co2EmissionsCombined</p></td>
      <td class="propType"><p>number</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>1</code></li>
          <li class="numeric">Max. value: <code>10000</code></li>
          <li>Only one decimal place is accepted. If more decimals are sent they will be truncated.</li>
          <li>Mandatory for German dealers when the vehicle type is <code>C</code> (Car), <code>primaryFuelType</code> is either <code>12</code> (electric) and no <code>additionalFuelTypes</code> is set or <code>primaryFuelType</code> is not <code>12</code> (electric) and the car is considered new (<code>mileage</code> <= 1000 and <code>firstRegistrationDate</code> <= 8 months).</li>
          <li>Forbidden for vehicleType <code>L</code> (trailer)</li>
          <li>Forbidden if NEDC consumption values are set (<code>consumption</code>, <code>co2Emissions</code> or <code>efficiencyClass</code>)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>The combined co2 emissions according to WLTP in g/km, one decimal place.</p>
      </td>
      <td class="propExample"><p><code>85.4</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-wltpcommon-co2emissionscombinedweighted"><p>co2EmissionsCombinedWeighted</p></td>
      <td class="propType"><p>number</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>1</code></li>
          <li class="numeric">Max. value: <code>10000</code></li>
          <li>Only one decimal place is accepted. If more decimals are sent they will be truncated.</li>
          <li>Mandatory for German dealers when the vehicle type is <code>C</code> (Car), primaryFuelType is <code>12</code> (electric) and <code>additionalFuelTypes</code> is not empty and the car is considered new (<code>mileage</code> <= 1000 and <code>firstRegistrationDate</code> <= 8 months).</li>
          <li>Forbidden for vehicleType <code>L</code> (trailer)</li>
          <li>Forbidden if NEDC consumption values are set (<code>consumption</code>, <code>co2Emissions</code> or <code>efficiencyClass</code>)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>The weighted combined co2 emissions for plug-in-hybrids according to WLTP in g/km, one decimal place.</p>
      </td>
      <td class="propExample"><p><code>84.4</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-wltpcommon-co2emissionsdischarged"><p>co2EmissionsDischarged</p></td>
      <td class="propType"><p>number</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>0.1</code></li>
          <li class="numeric">Max. value: <code>10000</code></li>
          <li>Optional for PHEV.</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>The CO2 emissions with a discharged battery according to WLTP in g/km, one decimal place.</p>
      </td>
      <td class="propExample"><p><code>116.2</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-wltpcommon-consumptioncity"><p>consumptionCity</p></td>
      <td class="propType"><p>number</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>0.1</code></li>
          <li class="numeric">Max. value: <code>10000</code></li>
          <li>Only one decimal place is accepted. If more decimals are sent they will be truncated.</li>
          <li>Optional for ICE and Mild/full Hybrids.</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>The fuel consumption according to WLTP in l/100km, one decimal place.</p>
      </td>
      <td class="propExample"><p><code>7.2</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-wltpcommon-consumptioncitydischarged"><p>consumptionCityDischarged</p></td>
      <td class="propType"><p>number</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>0.1</code></li>
          <li class="numeric">Max. value: <code>10000</code></li>
          <li>Only one decimal place is accepted. If more decimals are sent they will be truncated.</li>
          <li>Optional for PHEV.</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>The fuel consumption in the city with discharged battery according to WLTP in l/100km, one decimal place.</p>
      </td>
      <td class="propExample"><p><code>9.3</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-wltpcommon-consumptioncombined"><p>consumptionCombined</p></td>
      <td class="propType"><p>number</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>0.1</code></li>
          <li class="numeric">Max. value: <code>10000</code></li>
          <li>Only one decimal place is accepted. If more decimals are sent they will be truncated.</li>
          <li>Mandatory for German dealers when the vehicle type is <code>C</code> (Car), primaryFuelType is not <code>12</code> (electric) and the car is considered new (<code>mileage</code> <= 1000 and <code>firstRegistrationDate</code> <= 8 months).</li>
          <li>Forbidden for vehicleType <code>L</code> (trailer)</li>
          <li>Forbidden if NEDC consumption values are set (<code>consumption</code>, <code>co2Emissions</code> or <code>efficiencyClass</code>)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>The combined consumption according to WLTP in l/100km, one decimal place.</p>
      </td>
      <td class="propExample"><p><code>83.4</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-wltpcommon-consumptioncombineddischarged"><p>consumptionCombinedDischarged</p></td>
      <td class="propType"><p>number</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>0.1</code></li>
          <li class="numeric">Max. value: <code>10000</code></li>
          <li>Only one decimal place is accepted. If more decimals are sent they will be truncated.</li>
          <li>Mandatory for German dealers when the vehicle type is <code>C</code> (Car), primaryFuelType is <code>12</code> (electric) and <code>additionalFuelTypes</code> is not empty and the car is considered new (<code>mileage</code> <= 1000 and <code>firstRegistrationDate</code> <= 8 months).</li>
          <li>Forbidden for vehicleType <code>L</code> (trailer)</li>
          <li>Forbidden if NEDC consumption values are set (<code>consumption</code>, <code>co2Emissions</code> or <code>efficiencyClass</code>)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>The combined consumption for plug-in hybrids with empty battery according to WLTP in l/100km, one decimal place.</p>
      </td>
      <td class="propExample"><p><code>80.4</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-wltpcommon-consumptioncombinedweighted"><p>consumptionCombinedWeighted</p></td>
      <td class="propType"><p>number</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>0.1</code></li>
          <li class="numeric">Max. value: <code>10000</code></li>
          <li>Only one decimal place is accepted. If more decimals are sent they will be truncated.</li>
          <li>Mandatory for German dealers when the vehicle type is <code>C</code> (Car), primaryFuelType is <code>12</code> (electric) and <code>additionalFuelTypes</code> is not empty and the car is considered new (<code>mileage</code> <= 1000 and <code>firstRegistrationDate</code> <= 8 months).</li>
          <li>Forbidden for vehicleType <code>L</code> (trailer)</li>
          <li>Forbidden if NEDC consumption values are set (<code>consumption</code>, <code>co2Emissions</code> or <code>efficiencyClass</code>)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>The combined consumption according to WLTP in l/100km, one decimal place.</p>
      </td>
      <td class="propExample"><p><code>81.4</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-wltpcommon-consumptionelectriccity"><p>consumptionElectricCity</p></td>
      <td class="propType"><p>number</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>0.1</code></li>
          <li class="numeric">Max. value: <code>10000</code></li>
          <li>Only one decimal place is accepted. If more decimals are sent they will be truncated.</li>
          <li>Optional for EV and PHEV.</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>The electric consumption in the city according to WLTP in kWh/100km, one decimal place.</p>
      </td>
      <td class="propExample"><p><code>14.8</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-wltpcommon-consumptionelectriccombined"><p>consumptionElectricCombined</p></td>
      <td class="propType"><p>number</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>0.1</code></li>
          <li class="numeric">Max. value: <code>10000</code></li>
          <li>Only one decimal place is accepted. If more decimals are sent they will be truncated.</li>
          <li>Mandatory for German dealers when the vehicle type is <code>C</code> (Car), primaryFuelType is <code>12</code> (electric) and no <code>additionalFuelTypes</code> and the car is considered new (<code>mileage</code> <= 1000 and <code>firstRegistrationDate</code> <= 8 months).</li>
          <li>Forbidden for vehicleType <code>L</code> (trailer)</li>
          <li>Forbidden if NEDC consumption values are set (<code>consumption</code>, <code>co2Emissions</code> or <code>efficiencyClass</code>)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>The combined electric consumption according to WLTP in kWh/100km, one decimal place. For PHEVs this is the consumption when driving electric only.</p>
      </td>
      <td class="propExample"><p><code>82.4</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-wltpcommon-consumptionelectriccombinedweighted"><p>consumptionElectricCombinedWeighted</p></td>
      <td class="propType"><p>number</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>0.1</code></li>
          <li class="numeric">Max. value: <code>10000</code></li>
          <li>Only one decimal place is accepted. If more decimals are sent they will be truncated.</li>
          <li>Mandatory for German dealers when the vehicle type is <code>C</code> (Car), primaryFuelType is <code>12</code> (electric) and <code>additionalFuelTypes</code> is not empty and the car is considered new (<code>mileage</code> <= 1000 and <code>firstRegistrationDate</code> <= 8 months).</li>
          <li>Forbidden for vehicleType <code>L</code> (trailer)</li>
          <li>Forbidden if NEDC consumption values are set (<code>consumption</code>, <code>co2Emissions</code> or <code>efficiencyClass</code>)</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>The combined electric weighted consumption according to WLTP in kWh/100km, one decimal place.</p>
      </td>
      <td class="propExample"><p><code>80.4</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-wltpcommon-consumptionelectrichighway"><p>consumptionElectricHighway</p></td>
      <td class="propType"><p>number</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>0.1</code></li>
          <li class="numeric">Max. value: <code>10000</code></li>
          <li>Only one decimal place is accepted. If more decimals are sent they will be truncated.</li>
          <li>Optional for EV and PHEV.</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>The electric consumption on highways according to WLTP in kWh/100km, one decimal place.</p>
      </td>
      <td class="propExample"><p><code>19.2</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-wltpcommon-consumptionelectricrural"><p>consumptionElectricRural</p></td>
      <td class="propType"><p>number</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>0.1</code></li>
          <li class="numeric">Max. value: <code>10000</code></li>
          <li>Only one decimal place is accepted. If more decimals are sent they will be truncated.</li>
          <li>Optional for EV and PHEV.</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>The electric consumption in rural areas according to WLTP in kWh/100km, one decimal place.</p>
      </td>
      <td class="propExample"><p><code>14.8</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-wltpcommon-consumptionelectricsuburban"><p>consumptionElectricSuburban</p></td>
      <td class="propType"><p>number</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>0.1</code></li>
          <li class="numeric">Max. value: <code>10000</code></li>
          <li>Only one decimal place is accepted. If more decimals are sent they will be truncated.</li>
          <li>Optional for EV and PHEV.</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>The electric consumption in suburban areas according to WLTP in kWh/100km, one decimal place.</p>
      </td>
      <td class="propExample"><p><code>14.8</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-wltpcommon-consumptionhighway"><p>consumptionHighway</p></td>
      <td class="propType"><p>number</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>0.1</code></li>
          <li class="numeric">Max. value: <code>10000</code></li>
          <li>Only one decimal place is accepted. If more decimals are sent they will be truncated.</li>
          <li>Optional for ICE and Mild/full Hybrids.</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>The fuel consumption on highways according to WLTP in l/100km, one decimal place.</p>
      </td>
      <td class="propExample"><p><code>80.4</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-wltpcommon-consumptionhighwaydischarged"><p>consumptionHighwayDischarged</p></td>
      <td class="propType"><p>number</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>0.1</code></li>
          <li class="numeric">Max. value: <code>10000</code></li>
          <li>Only one decimal place is accepted. If more decimals are sent they will be truncated.</li>
          <li>Optional for PHEV.</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>The fuel consumption on highways with discharged battery according to WLTP in l/100km, one decimal place.</p>
      </td>
      <td class="propExample"><p><code>8.5</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-wltpcommon-consumptionrural"><p>consumptionRural</p></td>
      <td class="propType"><p>number</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>0.1</code></li>
          <li class="numeric">Max. value: <code>10000</code></li>
          <li>Only one decimal place is accepted. If more decimals are sent they will be truncated.</li>
          <li>Optional for ICE and Mild/full Hybrids.</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>The fuel consumption in rural areas according to WLTP in l/100km, one decimal place.</p>
      </td>
      <td class="propExample"><p><code>4.2</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-wltpcommon-consumptionruraldischarged"><p>consumptionRuralDischarged</p></td>
      <td class="propType"><p>number</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>0.1</code></li>
          <li class="numeric">Max. value: <code>10000</code></li>
          <li>Only one decimal place is accepted. If more decimals are sent they will be truncated.</li>
          <li>Optional for PHEV.</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>The fuel consumption in rural areas with discharged battery according to WLTP in l/100km, one decimal place.</p>
      </td>
      <td class="propExample"><p><code>8.4</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-wltpcommon-consumptionsuburban"><p>consumptionSuburban</p></td>
      <td class="propType"><p>number</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>0.1</code></li>
          <li class="numeric">Max. value: <code>10000</code></li>
          <li>Only one decimal place is accepted. If more decimals are sent they will be truncated.</li>
          <li>Optional for ICE and Mild/full Hybrids.</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>The fuel consumption in suburban areas according to WLTP in l/100km, one decimal place.</p>
      </td>
      <td class="propExample"><p><code>5.1</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-wltpcommon-consumptionsuburbandischarged"><p>consumptionSuburbanDischarged</p></td>
      <td class="propType"><p>number</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <ul>
          <li class="numeric">Min. value: <code>0.1</code></li>
          <li class="numeric">Max. value: <code>10000</code></li>
          <li>Only one decimal place is accepted. If more decimals are sent they will be truncated.</li>
          <li>Optional for PHEV.</li>
        </ul>
      </td>
      <td class="propDescription">
        <p>The fuel consumption in suburban areas with discharged battery according to WLTP in l/100km, one decimal place.</p>
      </td>
      <td class="propExample"><p><code>8.3</code></p></td>
    </tr>

  </tbody>
</table>


## WltpUnits
<table>
  <tbody>
    <tr>
      <th>Field name</th>
      <th>Type</th><th>Mandatory</th> <th>Other constraints</th>
      <th>Description</th>
      <th>Example</th>
    </tr>    <tr>
      <td class="propName" id="data-models-property-wltpunits-co2emissionscombinedunit"><p>co2EmissionsCombinedUnit</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Unit used for co2EmissionsCombined field</p>
      </td>
      <td class="propExample"><p><code>g/km</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-wltpunits-co2emissionscombinedweightedunit"><p>co2EmissionsCombinedWeightedUnit</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Unit used for co2EmissionsCombinedWeighted field</p>
      </td>
      <td class="propExample"><p><code>g/km</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-wltpunits-co2emissionsdischargedunit"><p>co2EmissionsDischargedUnit</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Unit used for co2EmissionsDischarged field</p>
      </td>
      <td class="propExample"><p><code>g/km</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-wltpunits-consumptioncitydischargedunit"><p>consumptionCityDischargedUnit</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Unit used for consumptionCityDischarged field</p>
      </td>
      <td class="propExample"><p><code>l/100km</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-wltpunits-consumptioncityunit"><p>consumptionCityUnit</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Unit used for consumptionCity field</p>
      </td>
      <td class="propExample"><p><code>l/100km</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-wltpunits-consumptioncombineddischargedunit"><p>consumptionCombinedDischargedUnit</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Unit used for consumptionCombinedDischarged field</p>
      </td>
      <td class="propExample"><p><code>l/100km</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-wltpunits-consumptioncombinedunit"><p>consumptionCombinedUnit</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Unit used for consumptionCombined field</p>
      </td>
      <td class="propExample"><p><code>l/100km</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-wltpunits-consumptioncombinedweightedunit"><p>consumptionCombinedWeightedUnit</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Unit used for consumptionCombinedWeighted field</p>
      </td>
      <td class="propExample"><p><code>l/100km</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-wltpunits-consumptionelectriccityunit"><p>consumptionElectricCityUnit</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Unit used for consumptionElectricCity field</p>
      </td>
      <td class="propExample"><p><code>kWh/100km</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-wltpunits-consumptionelectriccombinedunit"><p>consumptionElectricCombinedUnit</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Unit used for consumptionElectricCombined field</p>
      </td>
      <td class="propExample"><p><code>kWh/100km</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-wltpunits-consumptionelectriccombinedweightedunit"><p>consumptionElectricCombinedWeightedUnit</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Unit used for consumptionElectricCombinedWeighted field</p>
      </td>
      <td class="propExample"><p><code>kWh/100km</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-wltpunits-consumptionelectrichighwayunit"><p>consumptionElectricHighwayUnit</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Unit used for consumptionElectricHighway field</p>
      </td>
      <td class="propExample"><p><code>kWh/100km</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-wltpunits-consumptionelectricruralunit"><p>consumptionElectricRuralUnit</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Unit used for consumptionElectricRural field</p>
      </td>
      <td class="propExample"><p><code>kWh/100km</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-wltpunits-consumptionelectricsuburbanunit"><p>consumptionElectricSuburbanUnit</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Unit used for consumptionElectricSuburban field</p>
      </td>
      <td class="propExample"><p><code>kWh/100km</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-wltpunits-consumptionhighwaydischargedunit"><p>consumptionHighwayDischargedUnit</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Unit used for consumptionHighwayDischarged field</p>
      </td>
      <td class="propExample"><p><code>l/100km</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-wltpunits-consumptionhighwayunit"><p>consumptionHighwayUnit</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Unit used for consumptionHighway field</p>
      </td>
      <td class="propExample"><p><code>l/100km</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-wltpunits-consumptionruraldischargedunit"><p>consumptionRuralDischargedUnit</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Unit used for consumptionRuralDischarged field</p>
      </td>
      <td class="propExample"><p><code>l/100km</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-wltpunits-consumptionruralunit"><p>consumptionRuralUnit</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Unit used for consumptionRural field</p>
      </td>
      <td class="propExample"><p><code>l/100km</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-wltpunits-consumptionsuburbandischargedunit"><p>consumptionSuburbanDischargedUnit</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Unit used for consumptionElectricHighway field</p>
      </td>
      <td class="propExample"><p><code>l/100km</code></p></td>
    </tr>
    <tr>
      <td class="propName" id="data-models-property-wltpunits-consumptionsuburbanunit"><p>consumptionSuburbanUnit</p></td>
      <td class="propType"><p>string</p></td><td class="propMandatory"><p>No</p></td>      <td class="propConstraints">
        <p>None</p>
      </td>
      <td class="propDescription">
        <p>Unit used for consumptionSuburban field</p>
      </td>
      <td class="propExample"><p><code>l/100km</code></p></td>
    </tr>

  </tbody>
</table>


