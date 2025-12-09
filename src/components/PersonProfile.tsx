import React, { useEffect, useState } from 'react';
import { PersonData, VerseData, BookData } from '../types/person';
import { personService } from '../services/personService';
import { getPersonImages } from '../config/personImages';
import './PersonProfile.css';

interface PersonProfileProps {
  personID: string | null;
  onClose: () => void;
  onVerseClick?: (osisRef: string) => void;
  onPersonClick?: (personID: string) => void;
}

interface Event {
  name: string;
  description?: string;
  year?: string;
  place?: string;
  imageUrl?: string;
}

const PersonProfile: React.FC<PersonProfileProps> = ({ personID, onClose, onVerseClick, onPersonClick }) => {
  const [person, setPerson] = useState<PersonData | null>(null);
  const [verses, setVerses] = useState<VerseData[]>([]);
  const [books, setBooks] = useState<BookData[]>([]);
  const [loading, setLoading] = useState(false);
  const [relatedPeople, setRelatedPeople] = useState<Map<string, PersonData>>(new Map());
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    if (!personID) {
      setPerson(null);
      setVerses([]);
      setBooks([]);
      return;
    }

    const loadPersonData = async () => {
      setLoading(true);
      console.log('Loading person profile for ID:', personID);
      try {
        const personData = await personService.getPersonByID(personID);
        console.log('Person data loaded:', personData);
        setPerson(personData);

        if (personData) {
          // Parse events from the events field
          if (personData.events) {
            const parsedEvents = parseEvents(personData.events);
            setEvents(parsedEvents);
          }

          // Load verses
          const verseData = await personService.getVersesByPerson(personID);
          setVerses(verseData.slice(0, 50)); // Limit to first 50 verses

          // Load books written by this person
          const bookData = await personService.getBooksByWriter(personID);
          setBooks(bookData);

          // Load related people (family members)
          const relatedIDs = new Set<string>();
          if (personData.mother) relatedIDs.add(personData.mother);
          if (personData.father) relatedIDs.add(personData.father);

          const childrenIDs = personService.parsePeopleList(personData.children);
          childrenIDs.forEach(id => relatedIDs.add(id));

          const siblingsIDs = personService.parsePeopleList(personData.siblings);
          siblingsIDs.forEach(id => relatedIDs.add(id));

          const relatedMap = new Map<string, PersonData>();
          const relatedIDsArray = Array.from(relatedIDs);
          for (let i = 0; i < relatedIDsArray.length; i++) {
            const id = relatedIDsArray[i];
            const relatedPerson = await personService.getPersonByID(id);
            if (relatedPerson) {
              relatedMap.set(id, relatedPerson);
            }
          }
          setRelatedPeople(relatedMap);
        }
      } catch (error) {
        console.error('Error loading person data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPersonData();
  }, [personID]);

  const parseEvents = (eventsStr: string): Event[] => {
    // Parse events from comma-separated or pipe-separated list
    // Format could be: "Event Name|Description|Year|Place|ImageURL" or simpler variations
    if (!eventsStr) return [];

    const eventList = eventsStr.split(',').map(e => e.trim()).filter(e => e.length > 0);
    return eventList.map(eventStr => {
      const parts = eventStr.split('|').map(p => p.trim());
      return {
        name: parts[0] || eventStr,
        description: parts[1] || undefined,
        year: parts[2] || undefined,
        place: parts[3] || undefined,
        imageUrl: parts[4] || undefined
      };
    });
  };

  const getInitials = (name: string): string => {
    const words = name.split(' ');
    if (words.length >= 2) {
      return (words[0][0] + words[words.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  if (!personID) return null;

  return (
    <div className="person-profile-overlay">
      <div className="person-profile fb-profile-container">
        {loading && (
          <div className="person-profile-loading">
            <div className="loading-spinner-small"></div>
            <p>Loading profile...</p>
          </div>
        )}

        {!loading && person && (() => {
          const personImages = getPersonImages(personID || '');
          const coverStyle = personImages?.coverUrl
            ? { backgroundImage: `url(${personImages.coverUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
            : {};

          return (
            <>
              {/* Facebook-style Profile Header */}
              <div className="fb-profile-header">
                {/* Cover Photo Section */}
                <div className="fb-cover-photo" style={coverStyle}>
                  <button className="fb-close-button" onClick={onClose}>
                    ✕
                  </button>
                </div>

                {/* Profile Picture and Name Section */}
                <div className="fb-profile-info">
                  <div className="fb-avatar-container">
                    {personImages?.avatarUrl ? (
                      <img
                        src={personImages.avatarUrl}
                        alt={person.displayTitle}
                        className="fb-avatar fb-avatar-image"
                      />
                    ) : (
                      <div className="fb-avatar">
                        {getInitials(person.displayTitle)}
                      </div>
                    )}
                  </div>
                  <div className="fb-profile-name-section">
                    <h1 className="fb-profile-name">{person.displayTitle}</h1>
                    {person.alsoCalled && (
                      <p className="fb-profile-subtitle">Also known as: {person.alsoCalled}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Two-Column Layout */}
              <div className="fb-profile-body">
              {/* LEFT COLUMN */}
              <div className="fb-left-column">
                {/* About Card */}
                <div className="fb-card">
                  <h2 className="fb-card-title">About</h2>
                  <div className="fb-card-content">
                    {/* Dictionary Entry from Eaton's Bible Dictionary */}
                    {person.dictionaryText && (
                      <div className="fb-about-dictionary">
                        <div className="fb-dictionary-content">
                          {person.dictionaryText.split('\n').slice(0, 5).map((line, idx) => (
                            <p key={idx} className="fb-dictionary-paragraph">{line.trim()}</p>
                          ))}
                          {person.dictionaryLink && (
                            <a
                              href={person.dictionaryLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="fb-read-more-link"
                            >
                              Read more...
                            </a>
                          )}
                        </div>
                        <div className="fb-section-divider"></div>
                      </div>
                    )}

                    {/* Basic Info */}
                    <div className="fb-about-info">
                      {person.gender && (
                        <div className="fb-info-item">
                          <span className="fb-info-icon">⚥</span>
                          <span className="fb-info-text">{person.gender}</span>
                        </div>
                      )}
                      {person.birthYear && (
                        <div className="fb-info-item">
                          <span className="fb-info-icon">🎂</span>
                          <span className="fb-info-text">
                            Born: {person.birthYear}
                            {person.birthPlace && ` in ${person.birthPlace}`}
                          </span>
                        </div>
                      )}
                      {person.deathYear && (
                        <div className="fb-info-item">
                          <span className="fb-info-icon">✝</span>
                          <span className="fb-info-text">
                            Died: {person.deathYear}
                            {person.deathPlace && ` in ${person.deathPlace}`}
                          </span>
                        </div>
                      )}
                      {person.memberOf && (
                        <div className="fb-info-item">
                          <span className="fb-info-icon">👥</span>
                          <span className="fb-info-text">Member of: {person.memberOf}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Photos Card */}
                {personImages?.photos && personImages.photos.length > 0 && (
                  <div className="fb-card">
                    <h2 className="fb-card-title">Photos</h2>
                    <div className="fb-card-content">
                      <div className="fb-photo-grid">
                        {personImages.photos.map((photoUrl, idx) => (
                          <div key={idx} className="fb-photo-item">
                            <img src={photoUrl} alt={`${person.displayTitle} photo ${idx + 1}`} />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Books Written Card */}
                {books.length > 0 && (
                  <div className="fb-card">
                    <h2 className="fb-card-title">Books Written</h2>
                    <div className="fb-card-content">
                      <div className="fb-books-list">
                        {books.map(book => (
                          <div key={book.osisName} className="fb-book-item">
                            📖 {book.bookName}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Family Card */}
                {(person.father || person.mother || person.children || person.siblings) && (
                  <div className="fb-card">
                    <h2 className="fb-card-title">Family</h2>
                    <div className="fb-card-content">
                      {person.father && relatedPeople.get(person.father) && (
                        <div className="fb-family-item">
                          <span className="fb-family-label">Father:</span>
                          <span
                            className="fb-family-link"
                            onClick={() => {
                              if (onPersonClick) {
                                onPersonClick(person.father!);
                              }
                            }}
                          >
                            {relatedPeople.get(person.father)?.displayTitle}
                          </span>
                        </div>
                      )}
                      {person.mother && relatedPeople.get(person.mother) && (
                        <div className="fb-family-item">
                          <span className="fb-family-label">Mother:</span>
                          <span
                            className="fb-family-link"
                            onClick={() => {
                              if (onPersonClick) {
                                onPersonClick(person.mother!);
                              }
                            }}
                          >
                            {relatedPeople.get(person.mother)?.displayTitle}
                          </span>
                        </div>
                      )}
                      {person.siblings && (
                        <div className="fb-family-item">
                          <span className="fb-family-label">Siblings:</span>
                          <div className="fb-family-list">
                            {personService.parsePeopleList(person.siblings).map((id, idx) => (
                              <span key={id}>
                                {idx > 0 && ', '}
                                <span
                                  className="fb-family-link"
                                  onClick={() => {
                                    if (onPersonClick) {
                                      onPersonClick(id);
                                    }
                                  }}
                                >
                                  {relatedPeople.get(id)?.displayTitle || id}
                                </span>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {person.children && (
                        <div className="fb-family-item">
                          <span className="fb-family-label">Children:</span>
                          <div className="fb-family-list">
                            {personService.parsePeopleList(person.children).map((id, idx) => (
                              <span key={id}>
                                {idx > 0 && ', '}
                                <span
                                  className="fb-family-link"
                                  onClick={() => {
                                    if (onPersonClick) {
                                      onPersonClick(id);
                                    }
                                  }}
                                >
                                  {relatedPeople.get(id)?.displayTitle || id}
                                </span>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* RIGHT COLUMN */}
              <div className="fb-right-column">
                {/* Important Events Timeline Card */}
                {events.length > 0 && (
                  <div className="fb-card">
                    <h2 className="fb-card-title">Important Events</h2>
                    <div className="fb-card-content">
                      <div className="fb-timeline">
                        {events.map((event, idx) => (
                          <div key={idx} className="fb-timeline-item">
                            {event.imageUrl && (
                              <div className="fb-event-image-container">
                                <img
                                  src={event.imageUrl}
                                  alt={event.name}
                                  className="fb-event-image"
                                />
                              </div>
                            )}
                            <div className="fb-event-content">
                              <h3 className="fb-event-name">{event.name}</h3>
                              {event.description && (
                                <p className="fb-event-description">{event.description}</p>
                              )}
                              <div className="fb-event-meta">
                                {event.year && (
                                  <span className="fb-event-year">📅 {event.year}</span>
                                )}
                                {event.place && (
                                  <span className="fb-event-place">📍 {event.place}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}


                {/* Verse References Card */}
                {verses.length > 0 && (
                  <div className="fb-card">
                    <h2 className="fb-card-title">
                      Verse References ({person.verseCount} total, showing first {verses.length})
                    </h2>
                    <div className="fb-card-content">
                      <div className="fb-verses-list">
                        {verses.map(verse => (
                          <div
                            key={verse.osisRef}
                            className="fb-verse-item"
                            onClick={() => onVerseClick && onVerseClick(verse.osisRef)}
                          >
                            <span className="fb-verse-ref">{verse.osisRef}</span>
                            <span className="fb-verse-text">{verse.verseText}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
          );
        })()}

        {!loading && !person && (
          <div className="person-not-found">
            <p>Person profile not found for ID: {personID}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PersonProfile;
