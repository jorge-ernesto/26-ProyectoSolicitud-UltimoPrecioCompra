// Notas del archivo:
// - Secuencia de comando:
//      - Biomont CS Solicitud Validacion (customscript_bio_cs_solicitud_valida)
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
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['./lib/Bio.Library.Search', 'N'],

    function (objSearch, N) {

        const { log } = N;

        /**
         * Formularios
         *
         * 189: BIO_FRM_SOLICITUD_DE_COMPRA
         * 239: BIO_FRM_SOLICITUD_ECONOMATO
         */
        const forms = [189, 239];

        /******************/

        /**
         * Function to be executed after page is initialized.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
         *
         * @since 2015.2
         */
        function localizationContextEnter(scriptContext) {

            console.log('localizationContextEnter');
        }

        /**
         * Function to be executed when field is changed.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         * @param {string} scriptContext.fieldId - Field name
         * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
         * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
         *
         * @since 2015.2
         */
        function fieldChanged(scriptContext) {

            // Obtener el currentRecord y mode
            let recordContext = scriptContext.currentRecord;
            let mode = recordContext.getValue('id') ? 'edit' : 'create';

            // Obtener datos
            let form_id = recordContext.getValue('customform') || null;

            // Modo crear, editar, copiar y formularios
            if ((mode == 'create' || mode == 'edit' || mode == 'copy') && forms.includes(Number(form_id))) {

                setValueSubList(scriptContext, recordContext, mode);
            }
        }

        function setValueSubList(scriptContext, recordContext, mode) {

            // DEBUG
            // SI EL EVENTO OCURRE A NIVEL DE CAMPOS DE CABECERA
            // if (isEmpty(scriptContext.sublistId)) console.log('fieldChanged!!!', scriptContext);

            // SI EL EVENTO OCURRE A NIVEL DE SUBLISTA
            // if (!isEmpty(scriptContext.sublistId)) console.log('fieldChanged!!!', scriptContext);

            /******************/

            // SE EJECUTA SOLO CUANDO SE HACEN CAMBIOS EN LA SUBLISTA ITEM Y CAMPO ARTICULO
            if (scriptContext.sublistId == 'item' && scriptContext.fieldId == 'item') {

                // Obtener data de la sublista
                let line = scriptContext.line;

                // Obtener datos
                let solicitudId = recordContext.getValue('id');
                let tipoCambio = recordContext.getValue('exchangerate'); // Si la moneda es soles, el TC por defecto es 1

                // Debug
                // console.log('data', { solicitudId, tipoCambio });

                // Obtener campos
                let columnItem = recordContext.getCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'item',
                    line: line
                });

                // Validar data
                if (columnItem) {

                    // Obtener ultimo precio de compra, desde la ultima Solicitud registrada con el Articulo
                    let ultimoPrecioCompraSoles = objSearch.getUltimoPrecioCompraSoles_bySolicitudAndArticle(solicitudId, columnItem);

                    // Debug
                    console.log('ultimoPrecioCompraSoles', ultimoPrecioCompraSoles);

                    // Validar ultimo precio de compra
                    if (ultimoPrecioCompraSoles) {

                        // Setear ultimo precio de compra
                        recordContext.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_bio_cam_oc_ultimo_precio', // Ver campo en Netsuite ---> BIO_CAM_OC_ULTIMO_PRECIO (custcol_bio_cam_oc_ultimo_precio) ----> https://6462530.app.netsuite.com/app/common/custom/columncustfield.nl?id=8503
                            line: line,
                            value: (parseFloat(ultimoPrecioCompraSoles) / parseFloat(tipoCambio)).toFixed(2) || null
                        });
                    }
                }
            }
        }

        /****************** Helper ******************/

        let isEmpty = (value) => {

            if (value === ``) {
                return true;
            }

            if (value === null) {
                return true;
            }

            if (value === undefined) {
                return true;
            }

            if (value === `undefined`) {
                return true;
            }

            if (value === `null`) {
                return true;
            }

            return false;
        }

        return {
            localizationContextEnter: localizationContextEnter,
            fieldChanged: fieldChanged
        };

    });
