'use client'

import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { X, ExternalLink, Calendar, MapPin, Users, UserCheck, Building, FileText } from 'lucide-react'
import { cn, getStatusColor } from '@/lib/utils'

interface Event {
  id: string
  eventName: string
  link?: string
  type: 'CONFERENCE' | 'EXHIBITION' | 'WEBINAR'
  audienceGroups: string[]
  startDate: string
  participationTypes: string[]
  owner?: string
  location?: string
  status: 'EVALUATING' | 'COMMITTED' | 'CONTRACTED' | 'NOT_GOING'
  notes?: string
  createdAt: string
  updatedAt: string
}

interface EventDrawerProps {
  isOpen: boolean
  onClose: () => void
  event: Event | null
}

export default function EventDrawer({ isOpen, onClose, event }: EventDrawerProps) {
  if (!event) return null

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-in-out duration-500"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in-out duration-500"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-500 sm:duration-700"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-500 sm:duration-700"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto relative w-screen max-w-2xl">
                  <Transition.Child
                    as={Fragment}
                    enter="ease-in-out duration-500"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in-out duration-500"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                  >
                    <div className="absolute left-0 top-0 -ml-8 flex pr-2 pt-4 sm:-ml-10 sm:pr-4">
                      <button
                        type="button"
                        className="relative rounded-md text-gray-300 hover:text-white focus:outline-none focus:ring-2 focus:ring-white"
                        onClick={onClose}
                      >
                        <span className="absolute -inset-2.5" />
                        <span className="sr-only">Close panel</span>
                        <X className="h-6 w-6" aria-hidden="true" />
                      </button>
                    </div>
                  </Transition.Child>
                  <div className="flex h-full flex-col overflow-y-scroll bg-white py-6 shadow-xl">
                    <div className="px-4 sm:px-6">
                      <Dialog.Title className="text-base font-semibold leading-6 text-gray-900">
                        Event Details
                      </Dialog.Title>
                    </div>
                    <div className="relative mt-6 flex-1 px-4 sm:px-6">
                      <div className="space-y-6">
                        {/* Event Name */}
                        <div>
                          <h3 className="text-lg font-medium text-gray-900 mb-2">
                            {event.eventName}
                          </h3>
                          <div className="flex items-center space-x-4">
                            <span className={cn(
                              'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                              getStatusColor(event.status)
                            )}>
                              {event.status}
                            </span>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              {event.type}
                            </span>
                          </div>
                        </div>

                        {/* Link */}
                        {event.link && (
                          <div className="flex items-center space-x-2">
                            <ExternalLink className="w-5 h-5 text-gray-400" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">Event Link</p>
                              <a 
                                href={event.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:text-blue-800 break-all"
                              >
                                {event.link}
                              </a>
                            </div>
                          </div>
                        )}

                        {/* Start Date */}
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">Start Date</p>
                            <p className="text-sm text-gray-600">
                              {new Date(event.startDate).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </p>
                          </div>
                        </div>

                        {/* Location */}
                        {event.location && (
                          <div className="flex items-center space-x-2">
                            <MapPin className="w-5 h-5 text-gray-400" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">Location</p>
                              <p className="text-sm text-gray-600">{event.location}</p>
                            </div>
                          </div>
                        )}

                        {/* Owner */}
                        {event.owner && (
                          <div className="flex items-center space-x-2">
                            <UserCheck className="w-5 h-5 text-gray-400" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">Owner</p>
                              <p className="text-sm text-gray-600">{event.owner}</p>
                            </div>
                          </div>
                        )}

                        {/* Audience Groups */}
                        {event.audienceGroups.length > 0 && (
                          <div className="flex items-start space-x-2">
                            <Users className="w-5 h-5 text-gray-400 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">Audience Groups</p>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {event.audienceGroups.map((group, index) => (
                                  <span
                                    key={index}
                                    className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800"
                                  >
                                    {group}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Participation Types */}
                        {event.participationTypes.length > 0 && (
                          <div className="flex items-start space-x-2">
                            <Building className="w-5 h-5 text-gray-400 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">Participation Types</p>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {event.participationTypes.map((type, index) => (
                                  <span
                                    key={index}
                                    className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800"
                                  >
                                    {type}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Notes */}
                        {event.notes && (
                          <div className="flex items-start space-x-2">
                            <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">Notes</p>
                              <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{event.notes}</p>
                            </div>
                          </div>
                        )}

                        {/* Timestamps */}
                        <div className="border-t border-gray-200 pt-4">
                          <div className="text-xs text-gray-500 space-y-1">
                            <p>
                              Created: {new Date(event.createdAt).toLocaleString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                            <p>
                              Updated: {new Date(event.updatedAt).toLocaleString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
}
