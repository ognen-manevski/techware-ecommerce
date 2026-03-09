export class Customer {
    constructor({ firstName, lastName, email, phone = '' }) {
        this.firstName = firstName;
        this.lastName  = lastName;
        this.email     = email;
        this.phone     = phone;
    }

    get fullName() {
        return `${this.firstName} ${this.lastName}`;
    }
}
