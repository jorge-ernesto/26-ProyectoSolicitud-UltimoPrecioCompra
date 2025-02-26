/**
 * @NApiVersion 2.1
 * @NModuleScope SameAccount
 */
define(['N'],

    function (N) {

        const { log, runtime, record } = N;

        /******************/

        function getUser() {
            let user = runtime.getCurrentUser();
            return { user };
        }

        function error_log(title, data) {
            throw `${title} -- ${JSON.stringify(data)}`;
        }

        function error_message(message) {
            throw new Error(`${message}`);
        }

        return { getUser, error_log, error_message }

    });
