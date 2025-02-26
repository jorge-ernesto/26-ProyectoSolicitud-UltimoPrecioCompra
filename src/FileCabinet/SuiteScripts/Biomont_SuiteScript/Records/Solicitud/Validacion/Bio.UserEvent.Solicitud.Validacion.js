// Notas del archivo:
// - Secuencia de comando:
//      - Biomont UE Solicitud Validacion (customscript_bio_ue_solicitud_valida)
// - Registro:
//      - Solicitud (purchaserequisition)
// - Contexto de Localizacion:
//      - Peru

// Validación como la usa LatamReady:
// - ClientScript                   : No se ejecuta en modo ver. Solo se ejecuta en modo crear, copiar o editar.
// - En modo crear, copiar o editar : Validamos por el formulario.
// - En modo ver                    : Validamos por el pais de la subsidiaria.

/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['./lib/Bio.Library.Search', './lib/Bio.Library.Helper', 'N'],

    function (objSearch, objHelper, N) {

        const { log } = N;

        /**
         * Formularios
         *
         * 183: BIO_FRM_ORDEN_COMPRA
         * 249: BIO_FRM_ORDEN_COMPRA_CONTROL
         * 197: BIO_FRM_ORDEN_COMPRA_IMPORTACION
         * 225: BIO_FRM_ORDEN_COMPRA_SERVICIOS
         */
        const forms = [183, 249, 197, 225];

        /******************/

        /**
         * Defines the function definition that is executed before record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */
        function beforeSubmit(scriptContext) {

            // Obtener el newRecord y type
            let { newRecord, type } = scriptContext;

            // Obtener datos
            let form_id = newRecord.getValue('customform') || null;
            let ordenCompraId = newRecord.getValue('id') || null;
            let tipoCambio = newRecord.getValue('exchangerate') || null; // Si la moneda es soles, el TC por defecto es 1

            // Modo crear y formularios
            if (type == 'create' && forms.includes(Number(form_id))) {

                // Obtener data de la sublista
                let sublistName = 'item';
                let lineCount = newRecord.getLineCount({ sublistId: sublistName });
                let itemSublist = newRecord.getSublist({ sublistId: sublistName });

                // Recorrer sublista
                for (let i = 0; i < lineCount; i++) {
                    // log.debug('i', i);

                    // Obtener campos
                    let columnItem = newRecord.getSublistValue({
                        sublistId: sublistName,
                        fieldId: 'item',
                        line: i
                    });

                    // Validar data
                    if (columnItem) {

                        // Obtener ultimo precio de compra, desde la ultima Orden de Compra registrada con el Articulo
                        let ultimoPrecioCompraSoles = objSearch.getUltimoPrecioCompraSoles_byOCAndArticle(ordenCompraId, columnItem);

                        // Debug
                        // log.debug('ultimoPrecioCompraSoles', ultimoPrecioCompraSoles);

                        // Validar ultimo precio de compra
                        if (ultimoPrecioCompraSoles) {

                            // Setear ultimo precio de compra
                            newRecord.setSublistValue({
                                sublistId: sublistName,
                                fieldId: 'custcol_bio_cam_oc_ultimo_precio', // Ver campo en Netsuite ---> BIO_CAM_OC_ULTIMO_PRECIO (custcol_bio_cam_oc_ultimo_precio) ----> https://6462530.app.netsuite.com/app/common/custom/columncustfield.nl?id=8503
                                line: i,
                                value: (parseFloat(ultimoPrecioCompraSoles) / parseFloat(tipoCambio)).toFixed(2) || null
                            });
                        }
                    }
                }

                // Detener envio
                // objHelper.error_log('debug', 'Detener envio');
            }
        }

        return { beforeSubmit };

    });
