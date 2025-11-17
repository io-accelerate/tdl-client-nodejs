import PresentationUtils from './presentation_utils.js';

const stringIsEmpty = (value) =>
    (typeof value === 'string' && !value.trim()) || typeof value === 'undefined' || value === null;

export default class AuditStream {
    constructor() {
        this.str = '';
        this.startLine();
    }

    startLine() {
        this.str = '';
    }

    log_request(request) {
        const parametersAsString = PresentationUtils.to_displayable_request(request.params);
        const text = 'id = ' + request.id + ', req = ' + request.method + '(' + parametersAsString + ')';

        if (!stringIsEmpty(text) && this.str.length > 0) {
            this.str += ', ';
        }
        this.str += text;
    }

    log_response(response) {
        let text;
        if (Object.prototype.hasOwnProperty.call(response, 'result')) {
            text = 'resp = ' + PresentationUtils.to_displayable_response(response.result);
        } else {
            text = 'error = ' + response.message + ', (NOT PUBLISHED)';
        }
        if (!stringIsEmpty(text) && this.str.length > 0) {
            this.str += ', ';
        }
        this.str += text;
    }

    endLine() {
        console.log(this.str);
    }
}
