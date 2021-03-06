import * as React from 'react';
import ReactSelect from 'react-select';
import Async, { AsyncProps } from 'react-select/lib/Async';
import CreatableSelect, { Props as CreatableSelectProps } from 'react-select/lib/Creatable';
import { Props as SelectProps } from 'react-select/lib/Select';

import { StyleRulesCallback, withStyles, WithStyles } from '@material-ui/core/styles';

/* TODO will be refactoring enhanced select to be an abstraction. 
Styles added in this file and the below imports will be utilized for the abstraction. */ 
import DropdownIndicator from './components/DropdownIndicator';
import LoadingIndicator from './components/LoadingIndicator';
import MultiValue from './components/MultiValue';
import NoOptionsMessage from './components/NoOptionsMessage';
import Option from './components/Option';
import Control from './components/SelectControl';
import Placeholder from './components/SelectPlaceholder';

type ClassNames = 'root'
| 'input'
| 'noOptionsMessage'
| 'divider'
| 'suggestionRoot'
| 'highlight'
| 'suggestionItem'
| 'suggestionIcon'
| 'suggestionTitle'
| 'suggestionDescription'
| 'resultContainer'
| 'tagContainer'
| 'selectedMenuItem';

const styles: StyleRulesCallback<ClassNames> = (theme) => ({
  root: {
    width: '100%',
    position: 'relative',
    '& .react-select__control': {
      borderRadius: 0,
      boxShadow: 'none',
      border: `1px solid transparent`,
      backgroundColor: theme.bg.white,
      '&:hover': {
        border: `1px dotted #ccc`,
        cursor: 'text',
      },
      '&--is-focused, &--is-focused:hover': {
        border: `1px dotted #999`
      },
    },
    '& .react-select__value-container': {
      width: '100%',
      '& > div': {
        width: '100%',
      },
      '&.react-select__value-container--is-multi': {
        '& > div, & .react-select__input': {
          width: 'auto',
        },
      },
    },
    '& .react-select__input': {
      width: '100%',
      color: theme.palette.text.primary,
      '& input': {
        width: '100% !important',
      },
    },
    '& .react-select__menu': {
      margin: '-1px 0 0 0',
      borderRadius: 0,
      boxShadow: 'none',
      border: `1px solid ${theme.palette.primary.main}`,
      maxWidth: 415,
    },
    '& .react-select__menu-list': {
      padding: theme.spacing.unit / 2,
      backgroundColor: theme.bg.white,
    },
    '& .react-select__option': {
      transition: theme.transitions.create(['background-color', 'color']),
      color: theme.palette.text.primary,
      backgroundColor: theme.bg.white,
      cursor: 'pointer',
      padding: '12px',
      fontSize: '0.9rem',
    },
    '& .react-select__option--is-focused': {
      backgroundColor: theme.palette.primary.main,
      color: 'white',
    },
    '& .react-select__option--is-selected': {
      color: theme.palette.primary.main,
      '&.react-select__option--is-focused': {
        backgroundColor: theme.bg.white,
      },
    },
    '& .react-select__single-value': {
      color: theme.palette.text.primary,
      overflow: 'initial',
    },
    '& .react-select__indicator-separator': {
      display: 'none',
    },
    '& .react-select__dropdown-indicator': {
    },
    '& [class*="MuiFormHelperText-error"]': {
      paddingBottom: theme.spacing.unit,
    },
  },
  input: {
    fontSize: '0.9rem',
    padding: 0,
    display: 'flex',
    color: theme.palette.text.primary,
    cursor: 'pointer',
  },
  noOptionsMessage: {
    padding: `${theme.spacing.unit}px ${theme.spacing.unit * 2}px`,
  },
  divider: {
    height: theme.spacing.unit * 2,
  },
  suggestionRoot: {
    cursor: 'pointer',
    display: 'flex',
    width: 'calc(100% + 2px)',
    alignItems: 'space-between',
    justifyContent: 'space-between',
    borderBottom: `1px solid ${theme.palette.divider}`,
    '&:last-child': {
      borderBottom: 0,
    }
  },
  highlight: {
    color: theme.palette.primary.main,
  },
  suggestionItem: {
    padding: theme.spacing.unit,
  },
  suggestionIcon: {
    '& svg': {
      width: '40px',
      height: '40px',
    },
  },
  suggestionTitle: {
    fontSize: '1rem',
    color: theme.palette.text.primary,
  },
  suggestionDescription: {
    color: theme.color.headline,
    fontSize: '.75rem',
    fontWeight: 600,
    marginTop: 2,
  },
  resultContainer: {
    display: 'flex',
    flexFlow: 'row nowrap'
  },
  tagContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    '& > div': {
      margin: '2px',
    }
  },
  selectedMenuItem: {
    backgroundColor: `${theme.bg.main} !important`,
    '& .circle': {
      transition: theme.transitions.create(['fill']),
      fill: theme.palette.primary.main,
    },
    '& .outerCircle': {
      transition: theme.transitions.create(['stroke']),
      stroke: '#2967B1',
    },
    '& .insidePath *': {
      transition: theme.transitions.create(['stroke']),
      stroke: 'white',
    },
  },
});

export interface Item {
  value: string | number;
  label: string;
  data?: any;
}

export interface SelectState {
  data: any,
  isDisabled: boolean,
  isFocused: boolean;
  isSelected: boolean;
}

interface ActionMeta {
  action: string;
}

interface ActionMeta {
  action: string;
}

export interface NoOptionsMessageProps {
  inputValue: string;
}

export interface EnhancedSelectProps {
  options?: Item[];
  className?: string;
  components?: any;
  disabled?: boolean;
  isClearable?: boolean;
  isMulti?: boolean;
  isLoading?: boolean;
  variant?: 'async' | 'creatable';
  value?: Item | Item[] | null;
  label?: string;
  placeholder?: string;
  errorText?: string;
  styleOverrides?: any;
  onChange: (selected: Item | Item[], actionMeta: ActionMeta) => void;
  createNew?: (inputValue: string) => void;
  onInputChange?: (inputValue: string, actionMeta: ActionMeta) => void;
  loadOptions?: (inputValue: string) => Promise<Item| Item[]> | undefined;
  filterOption?: (option: Item, inputValue: string) => boolean | null;
}

// Material-UI versions of several React-Select components.
// Will override the RS defaults.
const _components = {
  Control,
  NoOptionsMessage,
  Placeholder,
  MultiValue,
  Option,
  DropdownIndicator,
  LoadingIndicator
};

type CombinedProps = EnhancedSelectProps
  & WithStyles<ClassNames>
  & BaseSelectProps
  & CreatableProps;

interface BaseSelectProps extends SelectProps<any> {
  classes: any;
  textFieldProps?: any;
}

interface CreatableProps extends CreatableSelectProps<any> {

}

class Select extends React.PureComponent<CombinedProps,{}> {
  render() {
    const {
      classes,
      className,
      components,
      createNew,
      disabled,
      errorText,
      filterOption,
      label,
      loadOptions,
      isClearable,
      isMulti,
      isLoading,
      placeholder,
      onChange,
      onInputChange,
      options,
      styleOverrides,
      value,
      variant,
      noOptionsMessage,
      onMenuClose,
      onBlur,
      blurInputOnSelect,
      ...restOfProps
    } = this.props;

    /*
    * By default, we use the built-in Option component from React-Select, along with several Material-UI based
    * components (listed in the _components variable above). To customize the select in a particular instance
    * (for example, to render more complicated options for search bars), provide the component to use in a prop
    * Object. Specify the name of the component to override as the object key, with the component to use in its
    * place as the value. Full list of available components to override is available at
    * http://react-select.com/components#replaceable-components. As an example, to provide a custom option component, use:
    * <Select components={{ Option: MyCustomOptionComponent }}.
    *
    * The components passed in as props will be merged with the overrides we are already using, with the passed components
    * taking precedence.
    */
    const combinedComponents = {..._components, ...components};

    // If async, pass loadOptions instead of options. A Select can't be both Creatable and Async.
    // (AsyncCreatable exists, but we have not adapted it.)
    type PossibleProps = BaseSelectProps | CreatableProps | AsyncProps<any>;
    const BaseSelect: React.ComponentClass<PossibleProps> = variant === 'creatable'
      ? CreatableSelect
      : variant === 'async'
        ? Async
        : ReactSelect;

    return (
      <BaseSelect
        {...restOfProps}
        isClearable={isClearable  || true }
        isSearchable
        blurInputOnSelect={blurInputOnSelect}
        isLoading={isLoading}
        defaultOptions
        cacheOptions={false}
        filterOption={filterOption}
        loadOptions={loadOptions}
        isMulti={isMulti}
        isDisabled={disabled}
        classes={classes}
        className={`${classes.root} ${className}`}
        classNamePrefix="react-select"
        styles={styleOverrides}
        textFieldProps={{
          label,
          errorText,
          disabled,
          InputLabelProps: {
            shrink: true,
          },
        }}
        value={value}
        onBlur={onBlur}
        options={options}
        components={combinedComponents}
        onChange={onChange}
        onMenuClose={onMenuClose}
        onInputChange={onInputChange}
        onCreateOption={createNew}
        placeholder={placeholder || 'Select a value...'}
        noOptionsMessage={noOptionsMessage}
        menuPlacement="auto"
      />
    );
  }
}

const styled = withStyles(styles, { withTheme: true });

export default styled(Select);

