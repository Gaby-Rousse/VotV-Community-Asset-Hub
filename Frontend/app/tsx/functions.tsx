export async function apiCall(url: string, formData: FormData | null, method: string = "POST"): Promise<any> {

    if (formData != null) {
        return await fetch(url, {
            credentials: "include",
            method: method,
            body: formData,
        });
    } else {
        return await fetch(url, {credentials: "include"});
    }

}