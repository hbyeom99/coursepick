import React from 'react';
import {ZipModal} from './zip/ZipPrimitives.jsx';
import EditorialPlaceDetails from './EditorialPlaceDetails.jsx';
export default function SchedulePlaceModal({place,onClose}){
 return <ZipModal className="schedule-place-modal place-detail-modal" title={place.name} onClose={onClose}><EditorialPlaceDetails place={place}/></ZipModal>;
}
