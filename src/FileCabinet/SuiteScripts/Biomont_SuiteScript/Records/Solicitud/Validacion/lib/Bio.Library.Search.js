/**
 * @NApiVersion 2.1
 * @NModuleScope SameAccount
 */
define(['N'],

    function (N) {

        const { log, search, record } = N;

        function getUltimoPrecioCompraSoles_bySolicitudAndArticle(solicitudId, itemId) {

            // Declarar variables
            let ultimaSolicitudId = null;
            let tipoCambio = null;
            let arrayUltimaSolicitud = [];
            let ultimoPrecioCompraSoles = null;

            /****************** OBTENER ULTIMA SOLICITUD Y ULTIMO TIPO DE CAMBIO ******************/
            // El id no esta definido o esta vacio
            if (!solicitudId || solicitudId.trim() == '') {
                solicitudId = '@NONE@';
            }

            // Crear una búsqueda para obtener los registros
            let searchObj = search.create({
                type: 'purchaserequisition',
                columns: [
                    search.createColumn({ name: "internalid", label: "ID interno" }),
                    search.createColumn({
                        name: "tranid",
                        sort: search.Sort.DESC,
                        label: "Número de documento"
                    }),
                    search.createColumn({ name: "exchangerate", label: "Tipo de cambio" })
                ],
                filters: [
                    ["mainline", "is", "F"], // Muestra solo detalle
                    "AND",
                    ['item', 'anyof', itemId],
                    'AND',
                    ['internalid', 'noneof', solicitudId] // Excluir la solicitud actual o no excluir nada
                ]
            });

            // Ejecutar la búsqueda y recorrer los resultados
            searchObj.run().each(function (result) {
                // Obtener informacion
                let { columns } = result;
                ultimaSolicitudId = result.getValue(columns[0]);
                tipoCambio = result.getValue(columns[2]); // Si la moneda es soles, el TC por defecto es 1

                // Detener la búsqueda
                return false;
            });

            // Debug
            // console.log('ultimaSolicitudId', ultimaSolicitudId); // En ClientScript
            // log.debug('ultimaSolicitudId', ultimaSolicitudId); // En UserEventScript
            // console.log('tipoCambio', tipoCambio); // En ClientScript
            // log.debug('tipoCambio', tipoCambio); // En UserEventScript

            // Validar ultima solicitud y ultimo tipo de cambio
            if (ultimaSolicitudId && tipoCambio) {

                /****************** OBTENER ULTIMO PRECIO DE COMPRA ******************/
                // Crear una búsqueda para obtener los registros
                let searchObj_ = search.create({
                    type: 'purchaserequisition',
                    columns: [
                        search.createColumn({ name: "internalid", label: "ID interno" }),
                        search.createColumn({
                            name: "tranid",
                            sort: search.Sort.DESC,
                            label: "Número de documento"
                        }),
                        search.createColumn({
                            name: "line",
                            sort: search.Sort.ASC,
                            label: "ID linea"
                        }),
                        search.createColumn({ name: "item", label: "Artículo" }),
                        search.createColumn({
                            name: "displayname",
                            join: "item",
                            label: "Nombre para mostrar"
                        }),
                        search.createColumn({ name: "unitabbreviation", label: "Unidades" }),
                        search.createColumn({ name: "quantityuom", label: "Cantidad en unidades de la transacción" }),
                        search.createColumn({ name: "fxrate", label: "Tasa de artículo (moneda extrajera)" }),
                        search.createColumn({ name: "fxamount", label: "Importe (moneda extranjera)" }),
                        search.createColumn({
                            name: "formulanumeric",
                            formula: "TO_NUMBER({fxamount})",
                            label: "Fórmula (numérica) - Importe (moneda extranjera)"
                        })
                    ],
                    filters: [
                        ["mainline", "is", "F"], // Muestra solo detalle
                        "AND",
                        ['item', 'anyof', itemId],
                        "AND",
                        ['internalid', 'anyof', ultimaSolicitudId]
                    ]
                });

                // Ejecutar la búsqueda y recorrer los resultados
                searchObj_.run().each(function (result) {
                    // Obtener informacion
                    let { columns } = result;
                    let columnItem = result.getValue(columns[3]);
                    let columnQuantityUom = result.getValue(columns[6]);
                    let columnPrice = result.getValue(columns[7]);
                    let columnFxAmount = result.getValue(columns[9]);

                    // Procesar informacion
                    let columnPriceCalculate = (parseFloat(columnFxAmount) / parseFloat(columnQuantityUom)).toFixed(2);

                    // Insertar informacion en array
                    arrayUltimaSolicitud.push({
                        columnItem,
                        columnQuantityUom,
                        columnPrice,
                        columnFxAmount,
                        columnPriceCalculate
                    });
                    return true;
                });

                arrayUltimaSolicitud.forEach((element, i) => {
                    // console.log('element', element); // En ClientScript
                    // log.debug('element', element); // En UserEventScript

                    // Es articulo
                    if (element.columnItem == itemId) {

                        // Obtener ultimo precio de compra
                        ultimoPrecioCompraSoles = parseFloat(element.columnPriceCalculate) * parseFloat(tipoCambio);
                    }
                });
            }

            // Validar ultima orden de compra y ultimo tipo de cambio
            if (ultimaSolicitudId && tipoCambio && false) {

                // Cargar el registro de la orden de compra
                let purchaseRequisition = record.load({
                    type: record.Type.PURCHASE_REQUISITION,
                    id: ultimaSolicitudId
                });

                /****************** OBTENER ULTIMO PRECIO DE COMPRA ******************/
                // Lista de articulos
                let sublistName = 'item';
                let lineCount = purchaseRequisition.getLineCount({ sublistId: sublistName });
                let itemSublist = purchaseRequisition.getSublist({ sublistId: sublistName });

                for (let i = 0; i < lineCount; i++) {
                    // console.log('i', i); // En ClientScript
                    // log.debug('i', i); // En UserEventScript

                    let columnItem = purchaseRequisition.getSublistValue({
                        sublistId: sublistName,
                        fieldId: 'item',
                        line: i
                    });
                    let columnPrice = purchaseRequisition.getSublistValue({
                        sublistId: sublistName,
                        fieldId: 'rate',
                        line: i
                    });

                    // Es articulo
                    if (columnItem == itemId) {

                        // Obtener ultimo precio de compra
                        ultimoPrecioCompraSoles = parseFloat(columnPrice) * parseFloat(tipoCambio);
                    }
                }
            }

            return ultimoPrecioCompraSoles;
        }

        return { getUltimoPrecioCompraSoles_bySolicitudAndArticle }

    });
