export interface EventModel {
  id: string;
  title: string;
  city: string;
  category: string;
  date: string;
  location: string;
  image: string;
}

export const sampleEvents: EventModel[] = [
  {
    id: "1",
    title: "Live Music Night",
    city: "Omaha",
    category: "Music",
    date: "Oct 15, 2026",
    location: "The Slowdown",
    image: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=600",
  },
  {
    id: "2",
    title: "Local Art Exhibition",
    city: "Omaha",
    category: "Art",
    date: "Oct 17, 2026",
    location: "Joslyn Art Museum",
    image: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=600",
  },
  {
    id: "3",
    title: "Food Truck Festival",
    city: "Kansas City",
    category: "Food",
    date: "Oct 18, 2026",
    location: "City Market",
    image: "https://images.unsplash.com/photo-1565123409695-7b5ef63a2efb?w=600",
  },
  {
    id: "4",
    title: "Community 5K Run",
    city: "Omaha",
    category: "Fitness",
    date: "Oct 20, 2026",
    location: "Memorial Park",
    image: "https://images.unsplash.com/photo-1530549387789-4c1017266635?w=600",
  },
  {
    id: "5",
    title: "Outdoor Movie Night",
    city: "Kansas City",
    category: "Entertainment",
    date: "Oct 21, 2026",
    location: "Crown Center",
    image: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600",
  },
  {
    id: "6",
    title: "Tech Networking Meetup",
    city: "Omaha",
    category: "Technology",
    date: "Oct 22, 2026",
    location: "Innovation Campus",
    image: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=600",
  },
  {
    id: "7",
    title: "Farmers Market",
    city: "Kansas City",
    category: "Community",
    date: "Oct 24, 2026",
    location: "River Market",
    image: "https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=600",
  },
  {
    id: "8",
    title: "Stand-Up Comedy",
    city: "Omaha",
    category: "Comedy",
    date: "Oct 25, 2026",
    location: "Funny Bone",
    image: "https://images.unsplash.com/photo-1585699324551-f6c309eedeca?w=600",
  },
  {
    id: "9",
    title: "Photography Workshop",
    city: "Kansas City",
    category: "Workshop",
    date: "Oct 26, 2026",
    location: "Crossroads Arts District",
    image: "https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=600",
  },
];
