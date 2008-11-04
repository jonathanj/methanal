Methanal.Validators.hasLength = function hasLength(value) {
    if (value === null || value.length == 0)
        return 'Value is mandatory';
}

Methanal.Validators.digitsOnly = function digitsOnly(value) {
    if (!/^\d*$/.test(value))
        return 'Value must be digits only';
}

Methanal.Validators.validEmail = function validEmail(email) {
    if (email.length == 0)
        return undefined;

    var regex = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;
    if (!regex.test(email))
        return 'Must be blank, or a valid e-mail address'
}

Methanal.Validators.notNull = function notNull(value) {
    if (value === null)
        return 'Value is mandatory';
}
