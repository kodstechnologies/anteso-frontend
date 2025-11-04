import React, { useState } from "react";

interface NotesProps {
    initialNotes?: string[];
}

const Notes: React.FC<NotesProps> = ({
    initialNotes = [
        "Publication or reproduction of this Certificate in any form other than by complete set of the whole report & in the language, written, is not permitted without the written consent of ABPL.",
        "Corrections/erasing invalidates the Test Report.",
        "Referred standard for Testing: AERB Test Protocol 2016 - AERB/RF-MED/SC-3 (Rev. 2) Quality Assurance Formats.",
        "Any error in this Report should be brought to our knowledge within 30 days from the date of this report.",
        "Results reported are valid at the time of and under the stated conditions of measurements.",
        "Name, Address & Contact detail is provided by Customer.",
    ],
}) => {
    const [notes, setNotes] = useState<string[]>(initialNotes);
    const [newNote, setNewNote] = useState("");

    const handleAddNote = () => {
        if (!newNote.trim()) return;
        setNotes([...notes, newNote.trim()]);
        setNewNote("");
    };

    const handleDeleteNote = (index: number) => {
        const updated = notes.filter((_, i) => i !== index);
        setNotes(updated);
    };

    return (
        <div className="mt-6 border rounded-lg p-4 bg-white shadow-sm">
            <h3 className="text-lg font-semibold mb-2">5. Notes</h3>

            <ol className="list-decimal pl-6 space-y-1">
                {notes.map((note, index) => (
                    <li key={index} className="flex justify-between items-start gap-2">
                        <span>
                            <strong>5.{index + 1}.</strong> {note}
                        </span>
                        <button
                            type="button"
                            onClick={() => handleDeleteNote(index)}
                            className="text-red-500 hover:text-red-700 font-medium"
                        >
                            Delete
                        </button>
                    </li>
                ))}
            </ol>

            {/* Add new note input */}
            <div className="mt-4 flex items-center gap-2">
                <input
                    type="text"
                    placeholder="Add a new note..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    className="border rounded-md p-2 flex-grow"
                />
                <button
                    type="button"
                    onClick={handleAddNote}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                    Add
                </button>
            </div>
        </div>
    );
};

export default Notes;
