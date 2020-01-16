// THIS TEST TESTS THE COMPONENT WITHOUT REDUX STORE
// MY current approach because it is easier and doesn't use a library in a way it was not intended to be used.

import React from 'react';
// Jest comes with test assertsions like toBe() and .toEqual() as well as Snapshot tests

import { mount, shallow, render } from 'enzyme';
// mounting => full DOM rendering including child components. If you are wanting to test interacting with a child component then the mount method can be used.
// shallow => renders only the component, no children --- good for unit testing, has access to lifecycle methods by default but cannot access props passed into the root component.
// render => renders to static HTML, including kids but does not have access to lifecycle methods and is less costly than mount

// Enzyme is a testing library that requires an adapter
import Enzyme from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

// don't forget to configure the adapter with the import
Enzyme.configure({ adapter: new Adapter() });

// then, just import the UNCONNECTED component (not the default export)
import { Program } from './Program';


// test suite
describe('Program Component', () => {

  // a test block
  test('displays a greeting', () => {

    const PROGRAM = shallow(<Program />);

    expect(PROGRAM.find('h1').text()).toEqual('Hello, ');
  })
});
