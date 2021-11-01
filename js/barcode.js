import { YAPI, YErrorMsg } from './yocto-api-esm/yocto_api_html.js';
import { YSerialPort } from './yocto-api-esm/yocto_serialport.js';
function decodeMH10code(hexdata) {
    let endpos = (hexdata.length >>> 1);
    let codes = [];
    for (let i = 0; i < endpos; i++) {
        codes[i] = parseInt(hexdata.substr(2 * i, 2), 16);
    }
    let data = String.fromCharCode.apply(null, codes);
    let last = codes[endpos - 1];
    while (last == 4 || last == 13 || last == 10 || last == 30) {
        endpos--;
        last = codes[endpos - 1];
    }
    let fields = {};
    let separator = 0x1d;
    let prevpos = 0;
    let matches;
    do {
        let pos = data.indexOf('\u001d', prevpos);
        if (pos < 0)
            pos = endpos;
        let field = data.slice(prevpos, pos).trim().replace(/\u001e/g, '<RS>');
        if (field.slice(0, 4) == 'GWCR') {
            // TT Electronics proprietary encoding
            let parts = field.split('|');
            fields['manufacturer'] = 'TT Electronics';
            fields['mfgpartnumber'] = parts[0];
            fields['count'] = parts[1];
            fields['date_code'] = parts[2];
            fields['coo'] = parts[3].slice(5, 7);
            fields['traceability'] = parts[3].slice(7);
        }
        else if (field.indexOf('[)>') >= 0) {
            // Typical ANSI/MH10.8 signature
            fields['signature'] = field;
        }
        else if (field.slice(0, 2) == '1P') {
            fields['mfgpartnumber'] = field.slice(2);
        }
        else if (field.slice(0, 2) == '1V') {
            fields['manufacturer'] = field.slice(2);
        }
        else if (field.slice(0, 2) == '1T') {
            fields['traceability'] = field.slice(2);
        }
        else if (field.slice(0, 2) == '4L') {
            fields['coo'] = field.slice(2);
        }
        else if (field[0] == 'P') {
            fields['product'] = field.slice(1);
        }
        else if (field[0] == 'Q') {
            fields['count'] = field.slice(1);
        }
        else if (field[0] == 'S') {
            fields['serial'] = field.slice(1);
        }
        else if (!(!(matches = field.match(/^(?:9D)*(1?[0-9]?)D(.*)$/)))) {
            console.log(matches);
            let fmt = parseInt(matches[1]);
            let datecode = matches[2];
            let datefmt = '';
            let date = new Date();
            let currYear = date.getFullYear();
            let year = 0;
            let month = 0;
            let week = 0;
            let yearDay = 0;
            let monthDay = 1;
            fields['datecode'] = datecode;
            switch (fmt) {
                case 0:
                    datefmt = 'ymd';
                    break;
                case 1:
                    datefmt = 'dmy';
                    break;
                case 2:
                    datefmt = 'mdy';
                    break;
                case 3:
                    datefmt = 'iz';
                    break;
                case 4:
                    datefmt = 'yz';
                    break;
                case 5:
                    datefmt = 'ymd';
                    break;
                case 6:
                    datefmt = 'Ymd';
                    break;
                case 7:
                    datefmt = 'my';
                    break;
                case 10:
                    datefmt = 'yw';
                    break;
                case 11:
                    datefmt = 'Yw';
                    break;
                case 12:
                    datefmt = 'Ymd';
                    break;
                case 13:
                    datefmt = 'yw';
                    break;
                case 16:
                    datefmt = 'Ymd';
                    break;
                case 17:
                    datefmt = 'dmY';
                    break;
            }
            console.log('Date format:' + fmt + ' (' + datefmt + ')');
            for (let f = 0; f < datefmt.length; f++) {
                switch (datefmt[f]) {
                    case 'i': // single-digit year number
                        let decennie = ((currYear / 10) % 10) >> 0;
                        if (parseInt(datecode[0]) > (currYear % 10)) {
                            decennie--;
                        }
                        datecode = decennie.toString() + datecode;
                    // fall through
                    case 'y':
                        datecode = '20' + datecode;
                    // fall through
                    case 'Y':
                        year = parseInt(datecode.slice(0, 4));
                        datecode = datecode.slice(4);
                        break;
                    case 'm':
                        month = parseInt(datecode.slice(0, 2)) - 1;
                        datecode = datecode.slice(2);
                        break;
                    case 'w':
                        week = parseInt(datecode.slice(0, 2));
                        datecode = datecode.slice(2);
                        break;
                    case 'z':
                        yearDay = parseInt(datecode.slice(0, 3));
                        datecode = datecode.slice(3);
                        break;
                    case 'd':
                        monthDay = parseInt(datecode.slice(0, 2));
                        datecode = datecode.slice(2);
                        break;
                }
            }
            console.log('year:' + year + ' month:' + month + ' day:' + monthDay + ' week:' + week + ' yearDay:' + yearDay);
            if (week) {
                // Compute date from ISO week number
                console.log('=> byYearWeek');
                date = new Date(year, 0, 1 + (week - 1) * 7);
                if (date.getDay() <= 4) {
                    date.setDate(date.getDate() - date.getDay() + 1);
                }
                else {
                    date.setDate(date.getDate() + 8 - date.getDay());
                }
            }
            else if (yearDay) {
                console.log('=> byYearDay');
                date = new Date(year, 0, yearDay);
            }
            else {
                console.log('=> byYearMonthDay');
                date = new Date(year, month, monthDay);
            }
            fields['proddate'] = (+date / 1000) >> 0;
        }
        else if (field[0] == 'K') {
            if (field.length == 1) {
                // Empty customer order number
                fields['distributor'] = 'Digi-Key';
            }
            else {
                fields['order_no'] = field.slice(1);
            }
        }
        else if (fields['distributor'] == 'Digi-Key') {
            if (field.slice(0, 2) == '1K') {
                fields['order_no'] = field.slice(2);
            }
            else if (field.slice(0, 3) == '4K') { // Farnell
                fields['line_no'] = field.slice(2);
            }
            else if (field.slice(0, 3) == '10K') {
                fields['invoice_no'] = field.slice(3);
            }
            else if (field.slice(0, 3) == '11K') { // Mouser
                fields['line_no'] = field.slice(3);
            }
            else if (field.slice(0, 3) == '11Z') {
                fields['pick'] = field.slice(3);
            }
            else if (field.slice(0, 3) == '12Z') {
                fields['part_id'] = field.slice(3);
            }
            else if (field.slice(0, 3) == '13Z') {
                fields['load_id'] = field.slice(3);
            }
            else if (field.slice(0, 3) == '20Z') {
                // ignore (zero padding)
            }
        }
        else if (field.slice(0, 3) == '11K') {
            // Mouser
            fields['invoice_no'] = field.slice(3);
        }
        else if (field.slice(0, 3) == '14K') {
            // Mouser
            fields['line_no'] = field.slice(3);
        }
        else {
            fields['unknown'] = field;
        }
        prevpos = pos + 1;
    } while (prevpos < endpos);
    return fields;
}
async function barcodeHandler(port, change) {
    let messages = await port.readMessages('', 1);
    await port.reset();
    if (messages.length == 0 || !messages[0])
        return;
    let form = document.getElementsByName('panelform').item(0);
    var formData = new FormData(form);
    for (let msg of messages) {
        let mh10 = decodeMH10code(msg);
        console.log(mh10);
        let fieldname;
        for (fieldname in mh10) {
            if (formData.has(fieldname)) {
                let input = document.getElementsByName(fieldname).item(0);
                input.value = mh10[fieldname];
            }
        }
    }
}
async function enableDeviceHandlers() {
    let errmsg = new YErrorMsg();
    if (await YAPI.RegisterHub('wss://127.0.0.1:4443', errmsg) != YAPI.SUCCESS) {
        console.error('Cannot contact VirtualHub on 127.0.0.1: ' + errmsg.msg);
        return;
    }
    // Search for Yocto-RS232 connected to barcode scanner
    let port = YSerialPort.FindSerialPort("DataMatrixReader");
    if (!await port.isOnline()) {
        console.error('No Yocto-RS232 named DataMatrixReader found');
        await YAPI.FreeAPI();
        return;
    }
    await port.set_serialMode("9600,8N1");
    await port.set_protocol("Frame:15ms");
    await port.reset();
    await port.registerValueCallback(barcodeHandler);
    console.log('Ready to receive DataMatrix codes');
}
enableDeviceHandlers();
//# sourceMappingURL=barcode.js.map