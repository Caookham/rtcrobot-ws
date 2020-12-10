var tableID = $('#dataTable');
var BTN = $('#export-btn');
var EXPORT = $('#export');

var newTr = `
<tr>
    <td><i class="fa fa-map-o mr-2" width="30" style="font-size: 30px;"></i>&nbsp;Map's Name</td>
    <td>Text</td>
    <td>
        <ul class="nav">
            <li class="nav-item"><a class="nav-link" href="#"><i class="fa fa-plus" style="font-size: 24;color: rgb(105,105,105);"></i></a></li>
            <li class="nav-item"><a class="nav-link" href="#"><i class="fa fa-pencil" style="color: rgb(105,105,105);font-size: 24;"></i></a></li>
            <li class="nav-item"><a class="nav-link" href="#"><i class="fa fa-trash-o" style="color: rgb(105,105,105);font-size: 24;"></i></a></li>
        </ul>
    </td>
</tr>`;

 $('.table-add').on('click', 'i', () => {

   const $clone = tableID.find('tbody tr').last().clone(true).removeClass('hide table-line');
    console.log('Clicked!')

   //if (tableID.find('tbody tr').length === 0) {

     $('tbody').append(newTr);
   //}

   //tableID.find('table').append($clone);
 });

 tableID.on('click', '.table-remove', function () {

   $(this).parents('tr').detach();
 });

 tableID.on('click', '.table-up', function () {

   const $row = $(this).parents('tr');

   if ($row.index() === 0) {
     return;
   }

   $row.prev().before($row.get(0));
 });

 tableID.on('click', '.table-down', function () {

   const $row = $(this).parents('tr');
   $row.next().after($row.get(0));
 });

 // A few jQuery helpers for exporting only
 jQuery.fn.pop = [].pop;
 jQuery.fn.shift = [].shift;

 BTN.on('click', () => {

   const $rows = $tableID.find('tr:not(:hidden)');
   const headers = [];
   const data = [];

   // Get the headers (add special header logic here)
   $($rows.shift()).find('th:not(:empty)').each(function () {

     headers.push($(this).text().toLowerCase());
   });

   // Turn all existing rows into a loopable array
   $rows.each(function () {
     const $td = $(this).find('td');
     const h = {};

     // Use the headers from earlier to name our hash keys
     headers.forEach((header, i) => {

       h[header] = $td.eq(i).text();
     });

     data.push(h);
   });

   // Output the result
   EXPORT.text(JSON.stringify(data));
 });

 $(document).ready(function() {
  $('#dataTable').DataTable( {
      select: true
  } );
} );