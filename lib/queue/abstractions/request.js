export default function Request(originalMessage, requestData) {
    this.originalMessage = originalMessage;
    this.id = requestData.id;
    this.method = requestData.method;
    this.params = requestData.params;
}
