import React from 'react';
import CourseSearchBox from './CourseSearchBox.jsx';
import {prepareKeywordSearch} from '../lib/searchSubmission.js';
// Home and Zip use one input, allow-list, autocomplete and submit contract.
export default function TravelKeywordSearch({onSearch,...props}){return <CourseSearchBox {...props} restricted onSearch={value=>onSearch(prepareKeywordSearch(value))}/>;}
