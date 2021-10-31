<HTML>
<HEAD>Form filled from a DataMatrix barcode</HEAD>
<BODY>
<SCRIPT type="module" src="/js/barcode.js"></script>
<tt>
<?php
    /* put your database code here - this is just a demo */
    var_dump($_POST);

    function PP($varname)
    { 
        if (!array_key_exists($varname, $_POST)) return '';
        $value = $_POST[$varname];
        if (!is_null($value)) Print(htmlquote($value)); 
    }
?>
</tt> 
<form name="panelform" action='myform.php' method='post' enctype="multipart/form-data">
<table>
<tr><td>Stock#:</td>     
    <td><input name="stockref" size='10' value="<?php PP("stockref");?>"></td>
    <td class="r">Rangement:</td>
    <td class="r"><input name="storageref" size='10' value="<?php PP("storageref");?>"></td>
</tr>
<tr><td colspan="4">&nbsp;</td></tr>
<tr><td>Fabricant:</td>       
    <td colspan="3"><input name="manufacturer" size='40' value="<?php PP("manufacturer");?>"></td>
</tr>
<tr><td>Ref. fabricant:</td>  
    <td colspan="3"><input name="mfgpartnumber" size='40' value="<?php PP("mfgpartnumber");?>"></td>
</tr>
<tr><td colspan="4">&nbsp;</td></tr>
<tr><td>Nb. pièces:</td>      
    <td><input name="count" size='10' value="<?php PP("count");?>"></td>
    <td class="r">COO:</td>   
    <td class="r"><input name="coo" size='10' value="<?php PP("coo");?>"></td>
</tr>
<tr><td>Code traçabilité:&nbsp;</td>
    <td colspan="3"><input name="traceability" size='40' value="<?php PP("traceability");?>"></td>
</tr>
<tr><td>DateCode:</td>        
    <td><input name="datecode" size='10' value="<?php PP("datecode");?>"></td>
    <td class="r">Date prod.:</td>
    <td class="r"><input name="proddate" size='10' value="<?php Print($_POST["proddate"] ? dateVeryShort($_POST["proddate"]) : ''); ?>"></td>
</tr>
</table>
</form>
</BODY>
