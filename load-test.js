import http from 'k6/http';

export const options = {
    vus: 100,
    duration: '30s',
};

export default function () {

    const user = {
        email: `user${__VU}@example.com`,
        password: 'Password123',
    };

    const params = {
        headers: {
            'Content-Type': 'application/json',
        },
    };

    http.post(
        'http://localhost:3000/api/v1/Auth/Login',
        JSON.stringify(user),
        params
    );
}