
class PresentationUtils {
        static to_displayable_request(params) {
            return params.map(param => {
                return PresentationUtils.serialize_and_compress(param);
            }).join(', ');
        }

        static to_displayable_response(value) {
            return PresentationUtils.serialize_and_compress(value);
        }

        static serialize_and_compress(value) {
            let representation = JSON.stringify(value);

            if (PresentationUtils.is_list(value)) {
                representation = representation.replace(/,/g, ', ');
            } else if (PresentationUtils.is_multiline_string(representation)) {
                representation = PresentationUtils.suppress_extra_lines(representation);
            }

            return representation;
        }

        static is_list(value) {
            return Array.isArray(value);
        }

        static is_multiline_string(value) {
            return value.includes("\\n");
        }

        static suppress_extra_lines(value) {
            if (typeof value !== 'string') return value.toString();

            const parts = value.split("\\n");
            const topLine = parts[0];
            const remainingLines = parts.length - 1;

            let representation = `${topLine} .. ( ${remainingLines} more line`;
            if (remainingLines > 1) {
                representation += 's';
            }
            representation += ' )"';
            return representation;
        }
}

module.exports = PresentationUtils;

module.exports = PresentationUtils;
