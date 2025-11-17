class TestActionProvider {
    constructor() {
        this._value = null;
    }

    get() {
        return new Promise((resolve) => {
            resolve(this._value);
        });
    }

    set(value) {
        this._value = value;
    }
}

export default new TestActionProvider();
