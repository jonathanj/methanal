// import Methanal.Preds
// import Methanal.Util
Methanal.Deps.oneOf = function oneOf(values) {
    Divmod.warn(
        'Methanal.Deps is deprecated, use Methanal.Preds',
        Divmod.DeprecationWarning);
    return Methanal.Util.partial(Methanal.Preds.oneOf, values);
};
