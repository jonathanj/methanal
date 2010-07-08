// import Divmod
// import Nevow.Athena
// import Methanal.Util



/**
 * Build a mapping of input node values to DOM nodes.
 */
Methanal.View.buildInputNodeMapping = function buildInputNodeMapping(node) {
    var inputs = {};
    var nodes = node.getElementsByTagName('input');
    for (var i = 0; i < nodes.length; ++i) {
        var node = nodes[i];
        inputs[node.value] = node;
    }
    return inputs;
}



/**
 * Validator / dependency handler.
 *
 * @type handlerID: C{Integer}
 * @ivar handlerID: Handler identifier
 *
 * @type cache: L{Methanal.View._HandlerCache}
 * @ivar cache: Parent cache
 *
 * @type fn: C{function}
 * @ivar fn: Handler function called with the values from inputs named in
 *     L{inputs}
 *
 * @type inputs: C{Array} of C{String}
 * @ivar inputs: Names of form inputs whose values are passed to L{fn} in order
 *     to determine visible outputs
 *
 * @type outputs: C{Array} of C{String}
 * @ivar outputs: Names of form outputs
 */
Divmod.Class.subclass(Methanal.View, '_Handler').methods(
    function __init__(self, handlerID, cache, fn, inputs, outputs) {
        self.handlerID = handlerID;
        self.cache = cache;
        self.fn = fn;
        self.inputs = inputs;
        self.outputs = outputs;
    },


    function update(self) {
        var values = [];
        for (var j = 0; j < self.inputs.length; ++j) {
            var value = self.cache.getData(self.inputs[j]);
            values.push(value);
        }
        self.value = self.fn.apply(null, values);
    });



Divmod.Error.subclass(Methanal.View, 'HandlerError').methods(
    function toString(self) {
        return 'HandlerError: ' + self.message;
    });



/**
 * Getting a control by name failed because the control does not exist.
 */
Divmod.Error.subclass(Methanal.View, 'MissingControlError').methods(
    function toString(self) {
        return 'MissingControlError: ' + self.message;
    });



/**
 * Management of L{Methanal.View._Handler}s.
 *
 * @type _inputToHandlers: C{object} mapping C{String} to {object}
 * @ivar _inputTohandlers: Mapping of input control names to sets of handler
 *     identifiers
 *
 * @type _outputToHandlers: C{object} mapping C{String} to {object}
 * @ivar _outputTohandlers: Mapping of output control names to sets of handler
 *     identifiers
 *
 * @type _handlers: C{object} mapping C{Integer} to L{Methanal.View._Handler}
 * @ivar _handlers: Mapping of handler identifiers to handler instances
 *
 * @type getData: C{function} taking C{String}
 * @ivar getData: The function for getting the value of a control by name
 *
 * @type update: C{function} taking C{String}, C{Array}
 * @ivar update: Called for each output control name with a sequence of values
 *     from handler functions, which can optionally return a C{boolean}
 *     indicating whether anything changed in an update, which is then returned
 *     from L{changed}.
 */
Divmod.Class.subclass(Methanal.View, '_HandlerCache').methods(
    function __init__(self, getData, update) {
        self.getData = getData;
        self.update = update;
        self._inputToHandlers = {};
        self._outputToHandlers = {};
        self._handlers = {};
        self._handlerID = 0;
    },


    /**
     * Call L{self.update} for the specified output controls and handler values.
     *
     * @type  outputs: C{object} mapping C{String}
     * @param outputs: Names of output controls to update; only the keys are
     *     relevant
     */
    function _updateOutputs(self, outputs) {
        var updated = false;
        for (var output in outputs) {
            var results = [];
            for (var handlerID in self._outputToHandlers[output]) {
                var handler = self._handlers[handlerID];
                results.push(handler.value);
            }
            if (results.length > 0) {
                updated |= self.update(output, results);
            }
        }
        return updated;
    },


    /**
     * Update a control name to handler mapping.
     *
     * @type  names: C{Array} of C{String}
     * @param names: Sequence of control names
     *
     * @type  mapping: C{object} mapping C{String} to {object}
     * @param mapping: Mapping of control names to sets of handler identifiers
     */
    function _updateHandlerMapping(self, names, mapping) {
        for (var i = 0; i < names.length; ++i) {
            var name = names[i];
            var handlers = mapping[name];
            if (handlers === undefined) {
                handlers = mapping[name] = {};
            }
            handlers[self._handlerID] = 1;
        }
    },


    /**
     * Add a new handler.
     *
     * @type  fn: C{function}
     * @param fn: Handler function taking arguments for as many L{inputs}
     *
     * @type  inputs: C{Array} of C{String}
     * @param inputs: Sequence of control names whose data is considered
     *     for determining the visibility of L{outputs}
     *
     * @type  outputs: C{Array} of C{String}
     * @param outputs: Sequence of control names of output controls
     */
    function addHandler(self, fn, inputs, outputs) {
        if (fn === undefined) {
            throw Methanal.View.HandlerError(
                'Specified handler function is not defined');
        }

        var handler = Methanal.View._Handler(
            self._handlerID, self, fn, inputs, outputs);

        self._updateHandlerMapping(inputs, self._inputToHandlers);
        self._updateHandlerMapping(outputs, self._outputToHandlers);

        self._handlers[self._handlerID] = handler;
        self._handlerID += 1;
    },


    /**
     * Ensure all specified output controls are updated.
     */
    function refresh(self, outputs) {
        for (var handlerID in self._handlers) {
            self._handlers[handlerID].update();
        }

        self._updateOutputs(outputs);
    },


    /**
     * Update relevant output controls when an input control has changed.
     *
     * @type  input: C{String}
     * @param input: Input control name
     *
     * @rtype:  C{boolean}
     * @return: Did any changes in the outputs occur during the updates?
     */
    function changed(self, input) {
        var handlers = self._inputToHandlers[input];
        var outputs = {};
        for (var handlerID in handlers) {
            var handler = self._handlers[handlerID];
            handler.update();
            for (var i = 0; i < handler.outputs.length; ++i) {
                outputs[handler.outputs[i]] = 1;
            }
        }

        return self._updateOutputs(outputs);
    });



/**
 * The number of calls to L{Methanal.View.FormBehaviour.thaw} did not match
 * the number of calls to L{Methanal.View.FormBehaviour.freeze}.
 */
Divmod.Error.subclass(Methanal.View, 'FreezeThawMismatch');



/**
 * A control reported as finished loading, once all controls were already
 * loaded.
 */
Divmod.Error.subclass(Methanal.View, 'UnexpectedControl');



/**
 * Base class for things that behave like forms.
 *
 * @type _validatorCache: L{Methanal.View._HandlerCache}
 *
 * @type _depCache: L{Methanal.View._HandlerCache}
 *
 * @type _frozen: C{Integer}
 * @ivar _frozen: Freeze counter
 *
 * @type controls: C{object} mapping C{String} to L{Methanal.View.FormInput}
 * @ivar controls: Mapping of form input names to form inputs; each form input
 *     adds itself to this mapping when it is loaded
 *
 * @type subforms: C{object} mapping C{String} to L{Methanal.View.FormBehaviour}
 * @ivar subforms: Mapping of form names to sub forms. Do not use this!
 *
 * @type fullyLoaded: C{boolean}
 * @ivar fullyLoaded: Have all the form inputs reported that they're finished
 *     loading?
 *
 * @type enableControlStriping: C{boolean}
 * @ivar enableControlStriping: Perform visual striping of active form controls?
 */
Nevow.Athena.Widget.subclass(Methanal.View, 'FormBehaviour').methods(
    /**
     * Handler cache update function for validators.
     *
     * C{values} represents a sequence of error messages, the first one is set
     * on the named control, assuming the control is active. If C{values} is
     * empty, all previously set errors are cleared.
     */
    function _validatorUpdate(self, name, values) {
        var control = self.getControl(name);
        if (control.active) {
            for (var i = 0; i < values.length; ++i) {
                var value = values[i];
                if (value) {
                    control.setError(value);
                    return;
                }
            }
        }
        control.clearError();
    },


    /**
     * Handler cache update function for dependencies.
     *
     * Activate the named control if all values in C{values} are a true value.
     */
    function _depUpdate(self, name, values) {
        function _and(x, y) {
            return x && y;
        };

        var control = self.getControl(name);
        result = Methanal.Util.reduce(_and, values, true);
        self.freeze();
        var changed = result !== control.active;
        control.setActive(result);
        self.thaw();
        return changed;
    },


    /**
     * Initialise internal form attributes.
     *
     * This should be called as soon as possible, to initialise the validator
     * and dependency caches, as well as defining several public-facing form
     * attributes.
     */
    function formInit(self) {
        self._frozen = 0;
        self.controls = {};
        self.subforms = {};

        function getData(name) {
            return self.getControl(name).getValue();
        };

        self._validatorCache = Methanal.View._HandlerCache(
            getData,
            function (name, values) { return self._validatorUpdate(name, values); });

        self._depCache = Methanal.View._HandlerCache(
            getData,
            function (name, values) { return self._depUpdate(name, values); });

        self.controlsLoaded = false;
        self.fullyLoaded = false;
    },


    /**
     * Freeze validity refreshing.
     *
     * L{Methanal.View.FormBehaviour.thaw} should be called for every call to
     * C{freeze}.
     */
    function freeze(self) {
        self._frozen++;
    },


    /**
     * Thaw validity refreshing.
     *
     * This should be called the same number of times as
     * L{Methanal.View.FormBehaviour.freeze}.
     *
     * @raise Methanal.View.FreezeThawMismatch: If the number of calls to
     *     L{thaw} do not match the number of calls to C{freeze}
     */
    function thaw(self) {
        self._frozen--;
        if (self._frozen === 0) {
            self._refreshValidity();
        } else if (self._frozen < 0) {
            throw Methanal.View.FreezeThawMismatch('Too many calls to "thaw".');
        }
    },


    /**
     * Refresh the validity of the form, based on the states of form inputs and
     * sub-forms.
     */
    function _refreshValidity(self) {
        if (self._frozen > 0) {
            return;
        }

        for (var controlName in self.controls) {
            var control = self.getControl(controlName);
            if (control.active && control.error) {
                self.setInvalid();
                return;
            }
        }

        for (var name in self.subforms) {
            if (!self.subforms[name].valid) {
                self.setInvalid();
                return;
            }
        }

        self.setValid();
    },


    /**
     * Report a control as having finished loading.
     *
     * Once all controls in L{controlNames} have reported in, form loading
     * completes by refreshing validators and dependencies, controls cannot
     * report in loading is complete.
     *
     * @type  control: L{Methanal.View.FormInput}
     * @param control: Control to report in
     */
    function loadedUp(self, control) {
        if (self.fullyLoaded) {
            throw new Methanal.View.UnexpectedControl(control.name);
        }

        delete self.controlNames[control.name];
        for (var name in self.controlNames) {
            return;
        }

        self.controlsLoaded = true;
        self._finishLoading();
    },


    /**
     * Perform control striping.
     *
     * If L{enableControlStriping} is C{false}, striping is not performed.
     */
    function _stripeControls(self) {
        if (self.enableControlStriping) {
            self.stripeControls();
        }
    },


    /**
     * Perform control striping.
     */
    function stripeControls(self) {
        var activeControlNames = Methanal.Util.filter(function (name) {
            var control = self.getControl(name);
            Methanal.Util.removeElementClass(
                control.widgetParent.node, 'methanal-control-even');
            return control.active;
        }, self._controlNamesOrdered);

        Methanal.Util.nthItem(activeControlNames, 2, 0,
            function (controlName) {
                var node = self.getControl(controlName).widgetParent.node;
                Methanal.Util.addElementClass(node, 'methanal-control-even');
            });
    },


    /**
     * Perform final form initialisation tasks.
     *
     * Once all controls in L{controlNames} have reported in and L{setActions}
     * has been called, form loading completes by refreshing validators and
     * dependencies, controls cannot report in loading is complete.
     */
    function _finishLoading(self) {
        if (!self.actions || !self.controlsLoaded || self.fullyLoaded) {
            return;
        }
        self.fullyLoaded = true;

        for (var name in self._depCache._inputToHandlers) {
            var node = self.getControl(name).widgetParent.node;
            Methanal.Util.addElementClass(node, 'dependancy-parent');
        }
        self.refresh();
        self._stripeControls();
    },


    /**
     * Set L{actions} and perform any pending initialisation.
     */
    function setActions(self, actions) {
        self.actions = actions;
        self._finishLoading();
    },


    /**
     * Get a form input by name.
     *
     * @type controlName: C{String}
     *
     * @raise MissingControlError: If the control given by L{controlName}
     *     does not exist
     *
     * @rtype: L{Methanal.View.FormInput}
     */
    function getControl(self, controlName) {
        var control = self.controls[controlName];
        if (control === undefined) {
            throw Methanal.View.MissingControlError(controlName);
        }
        return control;
    },


    /**
     * Attach a collection of validation functions to a group of form inputs.
     *
     * A "validator" is a C{[[String], [function]]} pair, an array of
     * controlNames and validation functions.
     *
     * The values of the form inputs, named by L{controlNames}, are all passed
     * to each function in L{fns}. This means that a "validator" can take
     * multiple form inputs' values into account in order to perform validation
     * for all of them.
     *
     * Use L{addValidators} to attach more than one "validator" at a time.
     *
     * @type  names: C{Array} of C{String}
     * @param names: Form input names to attach
     *
     * @type  fns: C{Array} of C{function}
     * @param fns: Validation functions to attach to each control named in
     *     L{names}
     */
    function addValidator(self, names, fns) {
        for (var i = 0; i < fns.length; ++i) {
            self._validatorCache.addHandler(fns[i], names, names);
        }
    },


    /**
     * Attach multiple validators at once.
     *
     * A "validator" is a C{[[String], [function]]} pair; an array of
     * controlNames and validation functions.
     *
     * @type  validators: C{Array} of validators
     * @param validators: Each validator is attached by calling L{addValidator}
     */
    function addValidators(self, validators) {
        for (var i = 0; i < validators.length; ++i) {
            var controls = validators[i][0];
            var fns = validators[i][1];
            self.addValidator(controls, fns);
        }
    },


    /**
     * An event that is called when a form input's value is changed.
     */
    function valueChanged(self, control) {
        var depsChanged = self._depCache.changed(control.name);
        self.validate(control);
        if (depsChanged) {
            self._stripeControls();
        }
    },


    /**
     * Update the validator cache for C{control} and refresh the form validity.
     */
    function validate(self, control) {
        self._validatorCache.changed(control.name);
        self._refreshValidity();
    },


    /**
     * Refresh caches and form validity for all inputs.
     */
    function refresh(self) {
        self._depCache.refresh(self.controls);
        self._validatorCache.refresh(self.controls);
        self._refreshValidity();
    },


    /**
     * Attach a collection of dependency functions to a group of form inputs.
     *
     * A "checker" is a C{[[String], [String], function} triple; an array of
     * input control names, output control names and a checker function.
     *
     * The values of the form inputs, named by L{inputNames}, are all passed to
     * L{fn}. This means that a "checker" can take multiple form inputs' values
     * into account in order to determine whether or not a dependency is met.
     *
     * The controls named by L{outputNames} determine which form inputs will
     * be made visible if L{fn} indicates that a dependency is met.
     *
     * Use L{addDepCheckers} to attach more than one "checker" at a time.
     */
    function addDepChecker(self, inputNames, outputNames, fn) {
        self._depCache.addHandler(fn, inputNames, outputNames);
    },


    /**
     * Attach multiple dependency checkers at once.
     *
     * A "checker" is a C{[[String], [String], function} triple; an array of
     * input control names, output control names and a checker function.
     *
     * @type  checkers: C{Array} of checkers
     * @param checkers: Each checker is attached by called L{addDepChecker}
     */
    function addDepCheckers(self, checkers) {
        for (var i = 0; i < checkers.length; ++i) {
            var inputNames = checkers[i][0];
            var outputNames = checkers[i][1];
            var fn = checkers[i][2];
            self.addDepChecker(inputNames, outputNames, fn);
        }
    });



/**
 * A form action.
 */
Nevow.Athena.Widget.subclass(Methanal.View, 'FormAction').methods(
    function __init__(self, node, args) {
        Methanal.View.FormAction.upcall(self, '__init__', node);
        self.actionID = args.actionID;
        self.allowViewOnly = args.allowViewOnly;
    },


    function nodeInserted(self) {
        if (self.widgetParent._disabled) {
            self.disable();
        } else {
            self.enable();
        }
    },


    /**
     * Enable form action.
     */
    function enable(self) {
        throw new Error('Subclasses must implement "enable"');
    },


    /**
     * Disable form action.
     */
    function disable(self) {
        throw new Error('Subclasses must implement "disable"');
    },


    /**
     * Get the parent L{Methanal.View.LiveForm}.
     */
    function getForm(self) {
        return self.widgetParent.widgetParent;
    },


    function invoke(self) {
        throw new Error('Subclasses must implement "invoke"');
    });



/**
 * Base class for push button form actions.
 */
Methanal.View.FormAction.subclass(Methanal.View, 'ActionButton').methods(
    function nodeInserted(self) {
        self._buttonNode = self.node.getElementsByTagName('button')[0];
        Methanal.View.ActionButton.upcall(self, 'nodeInserted');
        self.widgetParent.loadedUp(self);
    },


    function enable(self) {
        self._buttonNode.disabled = false;
        Methanal.Util.removeElementClass(self._buttonNode, 'methanal-submit-disabled');
    },


    function disable(self) {
        if (!self.allowViewOnly) {
            self._buttonNode.disabled = true;
            Methanal.Util.addElementClass(self._buttonNode, 'methanal-submit-disabled');
        }
    });



/**
 * Submit form action.
 *
 * Invoking this action calls L{Methanal.View.LiveForm.submit}.
 */
Methanal.View.ActionButton.subclass(Methanal.View, 'SubmitAction').methods(
    function invoke(self) {
        // Allow form submission to proceed and let the "onsubmit" handler run.
        return true;
    });



/**
 * Reset form action.
 *
 * Invoking this action calls L{Methanal.View.LiveForm.reset}.
 */
Methanal.View.ActionButton.subclass(Methanal.View, 'ResetAction').methods(
    function invoke(self) {
        self.getForm().reset();
        return false;
    });



/**
 * Form action container.
 *
 * @type throbber: L{Methanal.Util.Throbber}
 * @ivar throbber: Action throbber
 */
Nevow.Athena.Widget.subclass(Methanal.View, 'ActionContainer').methods(
    function __init__(self, node, args) {
        Methanal.View.ActionContainer.upcall(self, '__init__', node);
        self._disabled = false;
        self.actionIDs = args.actionIDs;
    },


    function nodeInserted(self) {
        self.throbber = Methanal.Util.Throbber(self);
        // Handle the case where there are no actions.
        self._finishLoading();
    },


    /**
     * Finalise the loading process if all actions have reported in.
     */
    function _finishLoading(self) {
        for (var name in self.actionIDs) {
            return;
        }
        self.widgetParent.setActions(self);
    },


    /**
     * Handle a form action reporting as having loaded.
     */
    function loadedUp(self, action) {
        delete self.actionIDs[action.actionID];
        self._finishLoading();
    },


    /**
     * Enable all form actions.
     */
    function enable(self) {
        for (var i = 0; i < self.childWidgets.length; ++i) {
            self.childWidgets[i].enable();
        }
        self._disabled = false;
    },


    /**
     * Disable all form actions.
     */
    function disable(self) {
        for (var i = 0; i < self.childWidgets.length; ++i) {
            self.childWidgets[i].disable();
        }
        self._disabled = true;
    });



/**
 * A form view.
 *
 * @type viewOnly: C{boolean}
 * @ivar viewOnly: Should the submit button for this form be visible?
 *
 * @type controlNames: C{object} of C{String}
 * @ivar controlNames: Names of form inputs as a mapping
 *
 * @type actions: L{Methanal.View.ActionContainer}
 * @ivar actions: Action container widget, this is only assigned once the action
 *     container widget's C{nodeInserted} method has been called
 */
Methanal.View.FormBehaviour.subclass(Methanal.View, 'LiveForm').methods(
    function __init__(self, node, viewOnly, controlNames) {
        self.enableControlStriping = true;
        Methanal.View.LiveForm.upcall(self, '__init__', node);
        self.viewOnly = viewOnly;
        if (!(controlNames instanceof Array)) {
            throw new Error('"controlNames" must be an Array of control names');
        }
        self.controlNames = Methanal.Util.arrayToMapping(controlNames);
        self._controlNamesOrdered = controlNames;
        self.formInit();
    },


    function nodeInserted(self) {
        self._formErrorNode = self.nodeById('form-error');
    },


    /**
     * Get the form associated with this widget.
     */
    function getForm(self) {
        return self;
    },


    /**
     * Focus the first form input.
     */
    function focusFirstInput(self) {
        // In case we couldn't find anything, this is as close as it'll get.
        self.node.focus();

        // Loop over input containers.
        for (var i = 0; i < self.childWidgets.length; ++i) {
            var container = self.childWidgets[i];
            // Loop over contained widgets.
            for (var j = 0; j < container.childWidgets.length; ++j) {
                var widget = container.childWidgets[j];
                if (widget.getInputNode) {
                    widget.getInputNode().focus();
                    return;
                } else {
                    // Edge closer and closer to something useful.
                    widget.node.focus();
                }
            }
        }
    },


    /**
     * Reset form inputs to their initial values.
     */
    function reset(self) {
        for (var name in self.controls) {
            self.getControl(name).reset();
        }
        self.refresh();
    },


    /**
     * Gather form data and invoke the server-side callback.
     *
     * If submission is successful L{submitSuccess} is called, and the
     * return value of the server-side callback is passed. If unsuccessful
     * L{submitFailure} is called and the failure is passed.
     *
     * @rtype: C{Deferred}
     * @return: A deferred that fires with the return value of L{submitSuccess}
     *     or, in the case of a failure, L{submitFailure}
     */
    function submit(self) {
        var data = {};
        for (var name in self.controls) {
            var input = self.getControl(name);
            data[input.name] = input.active ? input.getValue() : null;
        }
        for (var name in self.subforms) {
            var form = self.subforms[name];
            data[form.name] = form.getValue();
        }

        self.clearError();
        self.actions.disable();
        self.actions.throbber.start();

        var d = self.callRemote('invoke', data);
        d.addBoth(function (value) {
            self.actions.throbber.stop();
            self.actions.enable();
            return value;
        });
        d.addCallback(function (value) { return self.submitSuccess(value); });
        d.addErrback(function (value) { return self.submitFailure(value); });
        return d;
    },


    /**
     * Clear submission errors.
     */
    function clearError(self) {
        Methanal.Util.removeNodeContent(self._formErrorNode);
        self._formErrorNode.style.display = 'none';
    },


    /**
     * Set the submission error.
     *
     * @type failure: C{Divmod.Defer.Failure}
     */
    function setError(self, failure) {
        var T = Methanal.Util.DOMBuilder(self.node.ownerDocument);

        var a = T('a', {'class': 'methanal-submit-error-action'}, [
            T('img', {
                'src':   '/static/Methanal/images/icons/page_white_error.png',
                'title': 'Toggle traceback'})]);

        function showTraceback() {
            var traceback = T('pre', {}, [failure.toPrettyText()]);
            this.parentNode.parentNode.appendChild(traceback);
            this.onclick = hideTraceback;
        };

        function hideTraceback() {
            var node = this.parentNode.parentNode;
            node.removeChild(node.lastChild);
            this.onclick = showTraceback;
        };

        a.onclick = showTraceback;

        Methanal.Util.replaceNodeContent(self._formErrorNode, [
            T('h1', {}, ['Error submitting form', a]),
            T('div', {'class': 'methanal-submit-error-message'}, [
                self.formatFailure(failure)])]);
        self._formErrorNode.style.display = 'block';
    },


    /**
     * Extract an error message from a C{Divmod.Defer.Failure} instance.
     */
    function formatFailure(self, failure) {
        var text = failure.error.message;
        if (!text) {
            text = failure.toString();
        }
        return text;
    },


    /**
     * Callback for successful form submission.
     */
    function submitSuccess(self, value) {
    },


    /**
     * Callback for a failure form submission.
     */
    function submitFailure(self, failure) {
        self.setError(failure);
    },


    /**
     * Athena handler for the form's "onsubmit" event.
     *
     * If the form is "view only", no form submission takes place.
     */
    function handleSubmit(self) {
        if (self.viewOnly) {
            return false;
        }
        self.submit();
        return false;
    },


    /**
     * Enable the form for submission.
     */
    function setValid(self) {
        self.actions.enable();
    },


    /**
     * Disable form submission.
     */
    function setInvalid(self) {
        self.actions.disable();
    });



/**
 * Set a widget as active.
 *
 * The widget's visibility is determined by whether it is active or not,
 * inactive widgets are not visible and their values are not used in form
 * submission.
 *
 * @type active: C{boolean}
 */
Methanal.View._setActive = function _setActive(widget, active) {
    widget.active = active;
    if (active) {
        Methanal.Util.removeElementClass(widget.node, 'hidden');
    } else {
        Methanal.Util.addElementClass(widget.node, 'hidden');
    }
    if (widget.widgetParent.checkActive) {
        widget.widgetParent.checkActive();
    }
};



/**
 * A generic container for form inputs.
 */
Nevow.Athena.Widget.subclass(Methanal.View, 'InputContainer').methods(
    function __init__(self, node) {
        Methanal.View.InputContainer.upcall(self, '__init__', node);
        self.active = true;
    },


    /**
     * Get the form associated with this widget.
     */
    function getForm(self) {
        return self.widgetParent.getForm();
    },


    /**
     * Set the error state.
     *
     * @type  error: C{String}
     * @param error: Error message
     */
    function setError(self, error) {
        Methanal.Util.addElementClass(self.node, 'methanal-control-error');
    },


    /**
     * Reset the error state.
     */
    function clearError(self) {
        Methanal.Util.removeElementClass(self.node, 'methanal-control-error');
    },


    /**
     * Check child widgets for errors.
     *
     * If any child widget has an error, the container's error is set to the
     * same value.
     */
    function checkForErrors(self) {
        for (var i = 0; i < self.childWidgets.length; ++i) {
            var childWidget = self.childWidgets[i];
            if (childWidget.error !== null && childWidget.error !== undefined) {
                self.setError(childWidget.error);
                return;
            }
        }

        self.clearError();
    },


    /**
     * Set the container as active.
     *
     * The container's visibility is determined by whether it is active or not,
     * inactive controls' values are not used in form submission.
     *
     * @type active: C{boolean}
     */
    function setActive(self, active) {
        Methanal.View._setActive(self, active);
    },


    /**
     * Check the container's active-ness based on that of its child widgets.
     *
     * If no child widgets are active, the container is set as inactive.
     */
    function checkActive(self) {
        for (var i = 0; i < self.childWidgets.length; ++i) {
            var childWidget = self.childWidgets[i];
            if (childWidget.active) {
                self.setActive(true);
                return;
            }
        }

        self.setActive(false);
    });



/**
 * Container for visually organising inputs into rows.
 */
Methanal.View.InputContainer.subclass(Methanal.View, 'FormRow').methods(
    function nodeInserted(self) {
        self._errorTextNode = self.nodeById('error-text');
    },


    function setError(self, error) {
        Methanal.View.FormRow.upcall(self, 'setError', error);
        Methanal.Util.replaceNodeText(self._errorTextNode, error);
    },


    function clearError(self) {
        Methanal.View.FormRow.upcall(self, 'clearError');
        Methanal.Util.replaceNodeText(self._errorTextNode, '');
    },


    function setActive(self, active) {
        Methanal.View.FormRow.upcall(self, 'setActive', active);
        Methanal.Util.addElementClass(self.node, 'dependancy-child');
    });



/**
 * A cut-down L{LiveForm}.
 *
 * Simple forms have no way of submitting their data, their intended use is
 * a container for other controls to cleanly house their inputs, that
 * communicate data in their own way.
 */
Methanal.View.LiveForm.subclass(Methanal.View, 'SimpleForm').methods(
    function __init__(self, node, controlNames) {
        Methanal.View.SimpleForm.upcall(
            self, '__init__', node, true, controlNames);
    },


    function nodeInserted(self) {
        // Explicitly override LiveForm's "nodeInserted" method, most of the
        // nodes it attempts to find will not exist in a simple form.
    },


    function setValid(self) {
        self.widgetParent.clearError();
    },


    function setInvalid(self) {
        self.widgetParent.setError('');
    });



/**
 * Some kind of horrible input / form Frankenstein monster.
 *
 * Do not use this.
 */
Methanal.View.FormBehaviour.subclass(Methanal.View, 'GroupInput').methods(
    function __init__(self, node, name, controlNames) {
        Methanal.View.GroupInput.upcall(self, '__init__', node);
        self.formInit();
        self.name = name;
        self.setValid();
        self.controlNames = controlNames;
        self._controlNamesOrdered = [];
        for (var key in self.controlNames) {
            self._controlNamesOrdered.push(key);
        }
    },


    function getForm(self) {
        return self;
    },


    function setWidgetParent(self, widgetParent) {
        Methanal.View.GroupInput.upcall(self, 'setWidgetParent', widgetParent);
        if (self.widgetParent) {
            self.widgetParent.getForm().subforms[self.name] = self;
        }
    },


    function clearError(self) {
    },


    function setError(self, error) {
    },


    function setValue(self, value) {
    },


    function getValue(self) {
        var data = {};
        for (var name in self.controls) {
            var input = self.getControl(name);
            data[input.name] = input.active ? input.getValue() : null;
        }
        for (var name in self.subforms) {
            var form = self.subforms[name];
            data[form.name] = form.getValue();
        }
        return data;
    },


    function validate(self, control) {
        Methanal.View.GroupInput.upcall(self, 'validate', control);
        self.widgetParent.getForm().validate(control);
    },


    function setValid(self) {
        self.valid = true;
    },


    function setInvalid(self) {
        self.valid = false;
    });



/**
 * Base class for form inputs.
 *
 * @type name: C{String}
 * @ivar name: A name, unique to the form, for this input, by which it can be
 *     addressed
 *
 * @type label: C{String}
 * @ivar label: Brief but descriptive text about the input
 *
 * @type active: C{boolean}
 * @ivar active: Is this input currently active?
 *
 * @type error: C{String}
 * @ivar error: Error message applicable to this input, or C{null} if there is
 *     no error
 *
 * @type inputNode: DOM node
 * @ivar inputNode: The DOM node representing the primary source of data input;
 *     the base implementation will attempt to get and set values for this
 *     input
 */
Nevow.Athena.Widget.subclass(Methanal.View, 'FormInput').methods(
    /**
     * Initialise a form input.
     *
     * @param args.name: See L{name}
     *
     * @param args.label: See L{label}
     *
     * @param args.value: Initial value for this input
     */
    function __init__(self, node, args) {
        Methanal.View.FormInput.upcall(self, '__init__', node);
        self.name = args.name;
        self._initialValue = args.value;
        self.label = args.label;
        self.active = true;
        self.error = null;
    },


    function nodeInserted(self) {
        self.inputNode = self.getInputNode();
        self._errorNode = self.nodeById('error');
        self.reset();

        function _baseValidator(value) {
            return self.baseValidator(value);
        };

        var form = self.getForm();
        form.controls[self.name] = self;
        form.addValidator([self.name], [_baseValidator]);
        form.loadedUp(self);
    },


    /**
     * Reset the form input to its initial value.
     */
    function reset(self) {
        self.setValue(self._initialValue);
    },


    /**
     * Has this input finished loading?
     */
    function isLoaded(self) {
        return self.getForm().controlNames[self.name] === undefined;
    },


    /**
     * Get the form associated with this input.
     */
    function getForm(self) {
        return self.widgetParent.getForm();
    },


    /**
     * Get the DOM node primarily responsible for data input.
     */
    function getInputNode(self) {
        return self.node.getElementsByTagName('input')[0];
    },


    /**
     * Set the input's error.
     *
     * This also has the parent recheck its inputs for errors.
     *
     * @type  error: C{String}
     * @param error: Error message
     */
    function setError(self, error) {
        Methanal.Util.addElementClass(self.node, 'methanal-control-error');
        var node = self._errorNode;
        Methanal.Util.replaceNodeText(node, '\xa0');
        error = self.label + ': ' + error;
        node.title = error;
        node.style.display = 'block';
        self.error = error;
        self.widgetParent.checkForErrors();
    },


    /**
     * Reset the error state.
     */
    function clearError(self) {
        Methanal.Util.removeElementClass(self.node, 'methanal-control-error');
        var node = self._errorNode;
        Methanal.Util.replaceNodeText(node, '');
        node.style.display = 'none';
        self.error = null;
        self.widgetParent.checkForErrors();
    },


    /**
     * Set the input as active.
     *
     * The input's visibility is determined by whether it is active or not,
     * inactive controls' values are not used in form submission.
     *
     * @type active: C{boolean}
     */
    function setActive(self, active) {
        Methanal.View._setActive(self, active);
        self.getForm().validate(self);
    },


    /**
     * Set the input's value.
     */
    function setValue(self, value) {
        self.inputNode.value = value;
    },


    /**
     * Get the input's value.
     */
    function getValue(self) {
        return self.inputNode.value;
    },


    /**
     * Handler for the "onchange" DOM event.
     *
     * Inform the containing form that our value has changed.
     */
    function onChange(self, node) {
        self.getForm().valueChanged(self);
        return true;
    },


    /**
     * Essential validator.
     *
     * The base validator is always attached to the form's collection of
     * validators. This validator should be treated as specific to the input,
     * any other validation should be left up to validators attached directly
     * to the form. For example, an integer-only input's base validator should
     * ensure that only integer values are valid.
     *
     * @param value: The input data to be validated
     *
     * @rtype:  C{String}
     * @return: An error message if validation was unsuccessful or C{undefined}
     *     if there were no validation errors
     */
    function baseValidator(self, value) {
    });



/**
 * Multi-line text input.
 */
Methanal.View.FormInput.subclass(Methanal.View, 'TextAreaInput').methods(
    function setValue(self, value) {
        self.inputNode.value = value === null ? '' : value;
    },


    function getInputNode(self) {
        return self.node.getElementsByTagName('textarea')[0];
    });



/**
 * Text input.
 *
 * @type embeddedLabel: C{boolean}
 * @ivar embeddedLabel: Should L{label} be embedded in an empty input? As well
 *     as embedding the label in an empty input, a tooltip (containing the
 *     label) will be shown regardless of whether it is empty or not
 */
Methanal.View.FormInput.subclass(Methanal.View, 'TextInput').methods(
    /**
     * Initialise the input.
     *
     * @param args.embeddedLabel: See L{embeddedLabel}
     */
    function __init__(self, node, args) {
        Methanal.View.TextInput.upcall(self, '__init__', node, args);
        self.embeddedLabel = args.embeddedLabel;
        self._tooltipNode = null;
        self._useDisplayValue = false;
    },


    /**
     * Does the input need an embedded label?
     */
    function _needsLabel(self, value) {
        return self.embeddedLabel && !value;
    },


    /**
     * Set the embedded label.
     */
    function _setLabel(self, node) {
        node.value = self.label;
        Methanal.Util.addElementClass(node, 'embedded-label');
        self._labelled = true;
    },


    /**
     * Remove the embedded label.
     */
    function _removeLabel(self, node) {
        Methanal.Util.removeElementClass(node, 'embedded-label');
        self._labelled = false;
    },


    /**
     * Create a DOM node for the tooltip.
     */
    function _createTooltip(self) {
        if (!self._tooltipNode) {
            var doc = self.node.ownerDocument;
            var div = doc.createElement('div');
            Methanal.Util.replaceNodeText(div, self.label);
            Methanal.Util.addElementClass(div, 'tooltip');
            self.node.appendChild(div);
            self._tooltipNode = div;
        }
    },


    /**
     * Destroy the tooltip DOM node.
     */
    function _destroyTooltip(self) {
        if (self._tooltipNode) {
            self.node.removeChild(self._tooltipNode);
            self._tooltipNode = null;
        }
    },


    /**
     * Enable the human-readable "display value" representation.
     */
    function enableDisplayValue(self) {
        self._displayValueNode.style.display = 'block';
        self._useDisplayValue = true;
        self._updateDisplayValue();
    },


    /**
     * Disable the human-readable "display value" representation.
     */
    function disableDisplayValue(self) {
        self._displayValueNode.style.display = 'none';
        self._useDisplayValue = false;
    },


    /**
     * Create a "display value" from an input's value.
     *
     * @param value: The value as returned from C{getValue}
     *
     * @rtype:  C{String}
     */
    function makeDisplayValue(self, value) {
        throw new Error('Not implemented');
    },


    /**
     * Update the human-readable "display value" representation.
     *
     * L{Methanal.View.TextInput.makeDisplayValue} is called to determine the
     * new "display value."
     */
    function _updateDisplayValue(self) {
        if (!self._useDisplayValue) {
            return;
        }

        var value = self.getValue();
        var displayValue = '';
        if (value && self.baseValidator(value) === undefined) {
            displayValue = self.makeDisplayValue(value);
        }
        Methanal.Util.replaceNodeText(self._displayValueNode, displayValue);
    },


    function nodeInserted(self) {
        Methanal.View.TextInput.upcall(self, 'nodeInserted');
        self._displayValueNode = self.nodeById('displayValue');
    },


    function setValue(self, value) {
        if (self._needsLabel(value)) {
            self._setLabel(self.inputNode);
        } else {
            self._removeLabel(self.inputNode);
            self.inputNode.value = value === null ? '' : value;
        }
        self._updateDisplayValue();
    },


    function getValue(self) {
        if (self._labelled) {
            return '';
        }
        return Methanal.View.TextInput.upcall(self, 'getValue');
    },


    /**
     * Handle "onblur" DOM event.
     */
    function onBlur(self, node) {
        if (self.embeddedLabel) {
            self._destroyTooltip();
            if (self._needsLabel(node.value)) {
                self._setLabel(node);
                // XXX: It's possible that nothing actually changed and there
                // may be no reason to call onChange.
                self.onChange(node);
            } else {
                self._removeLabel(node);
            }
        }
    },


    /**
     * Handle "onfocus" DOM event.
     */
    function onFocus(self, node) {
        if (self._labelled) {
            self._removeLabel(node);
            node.value = '';
        }
        if (self.embeddedLabel) {
            self._createTooltip();
        }
    },


    /**
     * Handle "onkeyup" DOM event.
     */
    function onKeyUp(self, node) {
        self._updateDisplayValue();
    });



/**
 * Text input that filters input in real time.
 *
 * @type _filters: C{Array} of C{Function}
 * @ivar _filters: An array of "filters", which are simply JavaScript functions
 *     that accept and return a C{String}, and are used to transform the
 *     control's input in real time.
 *
 * @type _filterExpn: C{RegExp}
 * @ivar _filterExpn: The regular expression that the input must match in order
 *     to validate
 *
 * @type _extractExpn: C{RegExp}
 * @ivar _extractExpn: A regular expression used to extract the valid
 *     characters out of the input for error reporting
 */
Methanal.View.TextInput.subclass(Methanal.View, 'FilteringTextInput').methods(
    function __init__(self, node, args) {
        Methanal.View.FilteringTextInput.upcall(self, '__init__', node, args);
        self._filters = [];
        var expn = args.expression;
        if (expn !== null) {
            self._filterExpn = new RegExp('^(' + expn + ')+$');
            self._extractExpn = new RegExp(expn, 'g');
        }
    },


    /**
     * Add a real time "filter" to the form input.
     *
     * A "filter" is a JavaScript function that accepts a C{String} and
     * returns a modified version of that C{String}.
     *
     * Use L{addFilters} to add more than one "filter" at a time.
     *
     * @type filter: C{Function}
     * @param filter: Each filter is added to the list of existing filters
     *     attached to the control.  Each filter will be applied in the order
     *     it was attached.
     */
    function addFilter(self, filter) {
        self._filters.push(filter);
    },


    /**
     * Add multiple "filters" at once.
     *
     * A "filter" is a JavaScript function that accepts a C{String} and
     * returns a modified version of that C{String}.
     *
     * @type filters: C{Array} of C{Function}
     * @param filters: The array of "filters" will be concatenated to the
     *     existing array of filters attached to the control.
     */
    function addFilters(self, filters) {
        for (var i = 0; i < filters.length; ++i) {
            self.addFilter(filters[i]);
        }
    },


    /**
     * Apply each filtering function to the input's current value.
     */
    function filter(self) {
        var value = self.inputNode.value;
        for (var i = 0; i < self._filters.length; ++i) {
            value = self._filters[i](value);
        }
        self.setValue(value);
    },


    function onChange(self, node) {
        self.filter();
        Methanal.View.FilteringTextInput.upcall(self, 'onChange', node);
    },


    function onKeyUp(self, node) {
        self.filter();
        Methanal.View.FilteringTextInput.upcall(self, 'onKeyUp', node);
    },


    /**
     * If an expression was specified, this default baseValidator ensures
     * that the input's current value matches the expression exactly one or
     * more times.
     */
    function baseValidator(self, value) {
        var rv = Methanal.View.FilteringTextInput.upcall(
            self, 'baseValidator', value);
        if (rv) {
            return rv;
        }

        if (self._filterExpn !== undefined && !self._filterExpn.test(value)) {
            return 'Invalid characters: ' + value.replace(
                self._extractExpn, '');
        }
    });



/**
 * Text input that pre-populates another control with its own value on
 * the "onkeyup" and "onchange" DOM events.
 *
 * When used to pre-populate a FilteringTextInput, the value
 * will be transformed according to any filters defined in that input.
 *
 * @type _targetControlName: C{String}
 * @ivar _targetControlName: The name of the input that will be pre-populated.
 */
Methanal.View.TextInput.subclass(
    Methanal.View, 'PrePopulatingTextInput').methods(
    function __init__(self, node, args) {
        Methanal.View.PrePopulatingTextInput.upcall(
            self, '__init__', node, args);
        self._targetControlName = args.targetControlName;
    },


    function reset(self) {
        Methanal.View.PrePopulatingTextInput.upcall(self, 'reset');
        try {
            var targetControl = self.getTargetControl();
        } catch (e) {
            if (e instanceof Methanal.View.MissingControlError) {
                /* If the target control input node does not yet exist in the DOM,
                 * then we do not need to, and indeed cannot, reset its value along
                 * with this control's value.
                 */
                return;
            }
            throw e;
        }
        targetControl.setValue(self.inputNode.value);
        targetControl.onChange(targetControl.inputNode);
    },


    /**
     * Get the instance of the target control.
     */
    function getTargetControl(self) {
        return self.getForm().getControl(self._targetControlName);
    },


    function onKeyUp(self, node) {
        Methanal.View.PrePopulatingTextInput.upcall(self, 'onKeyUp', node);
        var targetControl = self.getTargetControl();
        targetControl.setValue(node.value);
        targetControl.onKeyUp(targetControl.inputNode);
    },


    function onChange(self, node) {
        Methanal.View.PrePopulatingTextInput.upcall(self, 'onChange', node);
        var targetControl = self.getTargetControl();
        targetControl.setValue(node.value);
        targetControl.onChange(targetControl.inputNode);
    });



/**
 * Checkbox input.
 */
Methanal.View.FormInput.subclass(Methanal.View, 'CheckboxInput').methods(
    function setValue(self, value) {
        self.inputNode.checked = !!value;
    },


    function getValue(self) {
        return self.inputNode.checked;
    });



/**
 * Base class for widgets that rely on multiple homogeneous inputs.
 */
Methanal.View.FormInput.subclass(Methanal.View, 'MultiInputBase').methods(
    function getInputNode(self) {
        return self.getInputNodes()[0];
    },


    /**
     * Get a mapping of input values to input DOM nodes.
     */
    function getInputNodes(self) {
        return Methanal.View.buildInputNodeMapping(self.node);
    });



/**
 * Group of radio button inputs.
 */
Methanal.View.MultiInputBase.subclass(Methanal.View, 'RadioGroupInput').methods(
    function setValue(self, value) {
        var nodes = self.getInputNodes();
        for (var name in nodes) {
            nodes[name].checked = name == value;
        }
    },


    function getValue(self) {
        var nodes = self.getInputNodes();
        for (var name in nodes) {
            if (nodes[name].checked == true) {
                return name;
            }
        }
        return '';
    });



/**
 * Multi-checkbox input.
 */
Methanal.View.MultiInputBase.subclass(
    Methanal.View, 'MultiCheckboxInput').methods(
    function setValue(self, values) {
        values = Methanal.Util.StringSet(values);
        var inputs = self.getInputNodes();
        for (var name in inputs) {
            inputs[name].checked = values.contains(name);
        }
    },


    function getValue(self) {
        var values = [];
        var nodes = self.getInputNodes();
        for (var name in nodes) {
            var node = nodes[name];
            if (node.checked) {
                values.push(name);
            }
        }
        return values;
    });



/**
 * A dropdown input.
 */
Methanal.View.FormInput.subclass(Methanal.View, 'SelectInput').methods(
    function __init__(self, node, args) {
        Methanal.View.SelectInput.upcall(self, '__init__', node, args);
        self._placeholderInserted = false;
    },


    /**
     * Create an C{option} DOM node.
     *
     * @type  value: C{String}
     *
     * @type  desc: C{String}
     * @param desc: User-facing textual description of the value
     */
    function _createOption(self, value, desc) {
        var doc = self.inputNode.ownerDocument;
        var optionNode = doc.createElement('option');
        optionNode.value = value;
        // Setting the "text" attribute is the only way to do this that works
        // in IE and everything else.
        optionNode.text = desc;
        return optionNode
    },


    /**
     * Insert a placeholder C{option} node.
     */
    function _insertPlaceholder(self) {
        if (self._placeholderInserted) {
            return;
        }

        var before = self.inputNode.getElementsByTagName('optgroup')[0];
        if (before === undefined) {
            before = self.inputNode.options[0];
        }
        var optionNode = self.insert('', self.label, before || null);
        Methanal.Util.addElementClass(optionNode, 'embedded-label');
        self._placeholderInserted = true;
    },


    /**
     * Insert a new option.
     *
     * @type  value: C{String}
     *
     * @type  desc: C{String}
     * @param desc: User-facing textual description of the value
     *
     * @param before: A DOM node to insert the option before, or C{null} to
     *     append the option
     *
     * @return: The newly inserted C{option} DOM node
     */
    function insert(self, value, desc, before) {
        var optionNode = self._createOption(value, desc);
        try {
            self.inputNode.add(optionNode, before);
        } catch (e) {
            // Every version of IE is null-intolerant.
            var index = undefined;
            if (before !== null) {
                // In browsers before IE8, the second argument to "add" is an
                // *index*. Great, thanks IE!

                // The index of an OPTGROUP is always -1, great.
                index = before.tagName == 'OPTGROUP' ? 0 : before.index;
            }
            self.inputNode.add(optionNode, index);
        }
        return optionNode;
    },


    /**
     * Append a new option.
     *
     * @type  value: C{String}
     *
     * @type  desc: C{String}
     * @param desc: User-facing textual description of the value
     */
    function append(self, value, desc) {
        return self.insert(value, desc, null);
    },


    function getInputNode(self) {
        return self.node.getElementsByTagName('select')[0];
    },


    function setValue(self, value) {
        Methanal.View.SelectInput.upcall(self, 'setValue', value);
        // Most browsers just automagically change the value to that of the
        // first option if you set the value to a nonexistent option value.
        // Please note this is "!=" and not "!==" to handle the auto-coercion
        // employed by select inputs for their "value" attribute.
        if (value === null || self.inputNode.value != value) {
            self._insertPlaceholder();
            self.inputNode.value = '';
        }
    },


    function getValue(self) {
        var value = Methanal.View.SelectInput.upcall(self, 'getValue');
        if (!value) {
            return null;
        }
        return value;
    });



Methanal.View.SelectInput.subclass(Methanal.View, 'MultiSelectInput').methods(
    /**
     * Get all selected C{option}'s values.
     *
     * @rtype:  C{Array} of C{String}
     * @return: A sequence of values for all selected C{option}s, or C{null} if
     *     there is no selection
     */
    function _getSelectedValues(self) {
        if (self.inputNode.selectedIndex === -1) {
            return null;
        }

        var values = [];
        var options = self.inputNode.options;
        for (var i = 0; i < options.length; ++i) {
            var item = options.item(i);
            if (item.selected) {
                values.push(item.value);
            }
        }

        return values;
    },


    /**
     * Clear the selection.
     */
    function clear(self) {
        self.inputNode.selectedIndex = -1;
        if (self.isLoaded()) {
            self.onChange(self.inputNode);
        }
        return false;
    },


    function setValue(self, values) {
        if (values === null) {
            self.clear();
            return;
        }

        var options = self.inputNode.options;
        for (var i = 0; i < options.length; ++i) {
            var option = options[i];
            for (var j = 0; j < values.length; ++j) {
                if (option.value === values[j]) {
                    option.selected = true;
                }
            }
        }
    },


    function getValue(self) {
        return self._getSelectedValues();
    },


    /**
     * Handle "onchange" DOM event.
     */
    function onChange(self, node) {
        var values = self._getSelectedValues();
        var selnode = self.nodeById('selection');
        if (values !== null) {
            Methanal.Util.replaceNodeText(
                selnode, 'Selected ' + values.length.toString() + ' item(s).');
            selnode.style.display = 'block';
        } else {
            selnode.style.display = 'none';
        }
        return Methanal.View.MultiSelectInput.upcall(self, 'onChange', node);
    });




/**
 * Textual date input.
 *
 * See L{Methanal.Util.Time.guess} for possible input values.
 */
Methanal.View.TextInput.subclass(Methanal.View, 'DateInput').methods(
    function __init__(self, node, args) {
        Methanal.View.TextInput.upcall(self, '__init__', node, args);
        self.twentyFourHours = args.twentyFourHours;
    },


    /**
     * Parse input.
     *
     * @raise Methanal.Util.TimeParseError: If L{value} is not valid or
     *     guess-able value
     *
     * @rtype:  L{Methanal.Util.Time}
     * @return: Parsed time or C{null} if L{value} is empty
     */
    function _parse(self, value) {
        if (!value) {
            return null;
        }
        return Methanal.Util.Time.guess(value).oneDay();
    },


    function nodeInserted(self) {
        Methanal.View.DateInput.upcall(self, 'nodeInserted');
        self.enableDisplayValue();
    },


    function makeDisplayValue(self, value) {
        var msg = '';
        try {
            // XXX: There is probably a potential bug here: If "value" (a UTC
            // timestamp) falls before the switch-over for daylight savings
            // before the timezone offset has been corrected for, the timezone
            // offset given here will be the wrong one.
            var d = new Date(value);
            var time = Methanal.Util.Time.fromTimestamp(
                value, d.getTimezoneOffset()).oneDay();
            if (time) {
                msg = time.asHumanly(self.twentyFourHours);
            }
        } catch (e) {
            if (!(e instanceof Methanal.Util.TimeParseError)) {
                msg = e.toString();
            }
            msg = 'Unknown date';
        }
        return msg;
    },


    function getValue(self) {
        var value = Methanal.View.DateInput.upcall(self, 'getValue');
        try {
            var time = self._parse(value);
            if (time !== null) {
                return time.asTimestamp();
            }
            return null;
        } catch (e) {
            return undefined;
        }
    },


    function baseValidator(self, value) {
        if (value === undefined) {
            return 'Invalid date value';
        }
    });



/**
 * Base class for numeric inputs.
 *
 * @type _validInput: C{RegExp}
 * @ivar _validInput: A regular expression used to test an input's value
 *     for validity
 */
Methanal.View.TextInput.subclass(Methanal.View, 'NumericInput').methods(
    function getValue(self) {
        var value = Methanal.View.NumericInput.upcall(self, 'getValue');
        if (!value) {
            return null;
        } else if (!self._validInput.test(value)) {
            return undefined;
        }

        return value;
    },


    function baseValidator(self, value) {
        if (value === undefined || isNaN(value)) {
            return 'Numerical value only';
        }
    });



/**
 * Integer input.
 */
Methanal.View.NumericInput.subclass(Methanal.View, 'IntegerInput').methods(
    function __init__(self, node, args) {
        Methanal.View.IntegerInput.upcall(self, '__init__', node, args);
        self._validInput = /^[-+]?\d+$/;
    },


    function getValue(self) {
        var value = Methanal.View.IntegerInput.upcall(self, 'getValue');
        if (value) {
            value = Methanal.Util.strToInt(value);
        }
        return value;
    });



/**
 * Decimal number input.
 *
 * @type decimalPlaces: C{Integer}
 * @ivar decimalPlaces: Number of decimal places
 */
Methanal.View.NumericInput.subclass(Methanal.View, 'DecimalInput').methods(
    function __init__(self, node, args) {
        Methanal.View.DecimalInput.upcall(self, '__init__', node, args);
        self.decimalPlaces = args.decimalPlaces;
        self._validInput = new RegExp(
            '^[-+]?\\d*(\\.\\d{0,' + self.decimalPlaces.toString() + '})?$');
    },


    function nodeInserted(self) {
        Methanal.View.DecimalInput.upcall(self, 'nodeInserted');
        self.enableDisplayValue();
    },


    function makeDisplayValue(self, value) {
        if (isNaN(value)) {
            return '';
        }
        return Methanal.Util.formatDecimal(value.toFixed(self.decimalPlaces));
    },


    function setValue(self, value) {
        if (typeof value == 'number') {
            value = value.toFixed(self.decimalPlaces);
        } else {
            value = '';
        }
        Methanal.View.DecimalInput.upcall(self, 'setValue', value);
    },


    function getValue(self) {
        var value = Methanal.View.DecimalInput.upcall(self, 'getValue');
        if (value) {
            return parseFloat(value);
        }
        return value;
    },


    function baseValidator(self, value) {
        var rv = Methanal.View.DecimalInput.upcall(
            self, 'baseValidator', value);
        if (rv) {
            return 'Numerical value, to a maximum of ' +
                self.decimalPlaces.toString() + ' decimal places only';
        }
    });



/**
 * Decimal input whose values are interpreted as percentages.
 */
Methanal.View.DecimalInput.subclass(Methanal.View, 'PercentInput').methods(
    function __init__(self, node, args) {
        // The value is represented as fractional percentage, but is displayed
        // (and input) as though it were an integer percentage. We don't
        // want two decimal places of non-existant precision.
        args.decimalPlaces = args.decimalPlaces - 2;
        Methanal.View.PercentInput.upcall(self, '__init__', node, args);
        self._validInput = new RegExp(
            '^\\d*(\\.\\d{0,' + self.decimalPlaces.toString() + '})?%?$');
    },


    function makeDisplayValue(self, value) {
        return (value * 100).toFixed(self.decimalPlaces) + '%';
    },


    function getValue(self) {
        var value = Methanal.View.PercentInput.upcall(self, 'getValue');
        if (value) {
            value = value / 100;
        }
        return value;
    },


    function setValue(self, value) {
        if (value) {
            value = value * 100;
        }
        Methanal.View.PercentInput.upcall(self, 'setValue', value);
    },


    function baseValidator(self, value) {
        var rv = Methanal.View.PercentInput.upcall(
            self, 'baseValidator', value);
        if (rv !== undefined) {
            return rv;
        } else if (value < 0 || value > 1) {
            return 'Percentage values must be between 0% and 100%'
        }
    });



/**
 * An invalid password strength criterion was specified.
 */
Divmod.Error.subclass(Methanal.View, 'InvalidStrengthCriterion');



/**
 * Password input with a verification field and strength checking.
 */
Methanal.View.TextInput.subclass(
    Methanal.View, 'VerifiedPasswordInput').methods(
    function __init__(self, node, args) {
        Methanal.View.VerifiedPasswordInput.upcall(
            self, '__init__', node, args);
        self._minPasswordLength = args.minPasswordLength || 5;
        self.setStrengthCriteria(args.strengthCriteria || []);
    },


    function nodeInserted(self) {
        self._confirmPasswordNode = self.nodeById('confirmPassword');
        Methanal.View.VerifiedPasswordInput.upcall(self, 'nodeInserted');
    },


    function reset(self) {
        Methanal.View.VerifiedPasswordInput.upcall(self, 'reset');
        self._confirmPasswordNode.value = self.inputNode.value;
    },


    /**
     * Set the password strength criteria.
     *
     * @type  criteria: C{Array} of C{String}
     * @param criteria: An array of names, matching those found in
     *     L{Methanal.View.VerifiedPasswordInput.STRENGTH_CRITERIA}, indicating
     *     the password strength criteria
     */
    function setStrengthCriteria(self, criteria) {
        var fns = Methanal.View.VerifiedPasswordInput.STRENGTH_CRITERIA;
        for (var i = 0; i < criteria.length; ++i) {
            var criterion = criteria[i];
            if (fns[criterion] === undefined) {
                criterion = Methanal.Util.repr(criterion);
                throw Methanal.View.InvalidStrengthCriterion(criterion);
            }
        }
        self._strengthCriteria = criteria;
    },


    /**
     * Override this method to change the definition of a 'strong' password.
     */
    function passwordIsStrong(self, password) {
        if (password.length < self._minPasswordLength) {
            return false;
        }

        var fns = Methanal.View.VerifiedPasswordInput.STRENGTH_CRITERIA;
        for (var i = 0; i < self._strengthCriteria.length; ++i) {
            var fn = fns[self._strengthCriteria[i]];
            if (!fn(password)) {
                return false;
            }
        }
        return true;
    },


    /**
     * This default validator ensures that the password is strong and that
     * the password given in both fields have length > 0 and match exactly.
     */
    function baseValidator(self, value) {
        if (value !== self._confirmPasswordNode.value || value === null ||
            self._confirmPasswordNode.value === null) {
            return 'Passwords do not match.';
        }

        if (!self.passwordIsStrong(value)) {
            return 'Password is too weak.';
        }
    });



Methanal.View.VerifiedPasswordInput.STRENGTH_CRITERIA = {
    'ALPHA':     function (value) { return /[a-zA-Z]/.test(value); },
    'NUMERIC':   function (value) { return /[0-9]/.test(value); },
    'MIXEDCASE': function (value) {
        return /[a-z]/.test(value) && /[A-Z]/.test(value); },
    'SYMBOLS':   function (value) { return /[^A-Za-z0-9\s]/.test(value); }};
